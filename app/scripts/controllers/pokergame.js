 'use strict';

app.controller("PokergameCtrl", function($firebaseObject, $routeParams, FIREBASE_URL, $scope, $timeout, Auth, Table, user) {
	var ref = new Firebase(FIREBASE_URL+"/pokerrooms/" + $routeParams.roomid );

	var ref2 = new Firebase(FIREBASE_URL);
	var profileRef = ref2.child('profile').child(user.uid);
	var profileRef2 = ref2.child('profile');
	$scope.userList = $firebaseObject(profileRef2);

	if(!user){
		$location.path('/register');
	} else {
	  	$scope.user = user;
	  	$scope.user.profile = $firebaseObject(profileRef);
	}

	var pokerGame = $firebaseObject(ref);
	$scope.table = new Table(10,20,2,10,100,1000);

	pokerGame.$loaded().then(function(data){ 
		$scope.roomMaster = pokerGame.createdBy;  											
		if (!pokerGame.pokertable){   		//creates game if one isnt created
	  	 ref.child("pokertable").update($scope.table);
	  		pokerGame.$watch(loadGame);
	  		console.log($scope.table);
		} else {	                       //continue game if ones in progress
	  		loadGame();
	  		pokerGame.$watch(loadGame);
	  		if($scope.roomMaster===user.profile.username){
	  			trackAction();
	  		}
		}
	});

	var loadGame = function() {
		
		for(var k in pokerGame.pokertable) {
	  	
			if(k === 'game'){
				for(var g in pokerGame.pokertable.game) {
					$scope.table.game[g] = pokerGame.pokertable.game[g];
				}
				if(pokerGame.pokertable.game.board === undefined){
					 //clear comunity cards if not in database
					 $scope.table.game.board.splice(0, $scope.table.game.board.length);
				}
			} else if(k === 'players'){
				for(var i in pokerGame.pokertable.players) {
					//add player for any player in the database
					if( pokerGame.pokertable.players[i] && !$scope.table.players[i] ){
	  					$scope.table.AddPlayer(chance.name(), 1000, pokerGame.pokertable.players[i].seat, pokerGame.pokertable.players[i].user); 
	  				}
	  				for(var j in pokerGame.pokertable.players[i]) {
	  					$scope.table.players[i][j]=pokerGame.pokertable.players[i][j];
	  				}	
	  			}
	  			for(var i in $scope.table.players) {
	  				//remove any player not in the database
	  				if( pokerGame.pokertable.players[i] === undefined ){
	  					$scope.table.RemovePlayer($scope.table.players[i].seat); 
	  				}
	  			}
	  				
			} else {
				$scope.table[k]=pokerGame.pokertable[k];
			}
		};
		console.log($scope.table);
	}

	var trackAction = function() {
	  $scope.$watch('table.game.actionOn + table.game.roundName', function(newValue, oldValue) {
  		if($scope.table.game.actionOn !== undefined&&$scope.table.game.actionOn !== false&&$scope.table.players[$scope.table.game.actionOn].user === 'bot' && $scope.table.game.roundName!=='Showdown'){
  			console.log("bot "+ $scope.table.players[$scope.table.game.actionOn].playerName+" turn");
  			$timeout(botAction, 1500);
  		}	
	  });
	}

	var botAction = function() {
		$scope.table = PokerBot($scope.table);
		ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.newHand = function(){
		for(var i = 0; i < $scope.table.players.length; i++){
			$scope.table.players[i].cards[0] = undefined;
			$scope.table.players[i].cards[1] = undefined;
		}
		$scope.table.game.board.splice(0, $scope.table.game.board.length);
		ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
		$timeout(function(){
			$scope.table.initNewRound();
			ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
		}, 1500);
	}

	$scope.call = function (seat) {
		$scope.table.players[$scope.table.seats[seat]].Call($scope.table);
	 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.raise = function (seat) {
		$scope.table.players[$scope.table.seats[seat]].Bet(20,$scope.table);
	 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.fold = function (seat) {
		$scope.table.players[$scope.table.seats[seat]].Fold($scope.table);
	 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.addPlayer = function (seat) {
		$scope.table.AddPlayer(chance.name(), 1000, seat, 'bot');
	 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.removePlayer= function (seat) {
		$scope.table.RemovePlayer(seat);
	 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.startGame = function() {
		if($scope.table.NewRound()){
			trackAction();
		 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));	
		}
	}

	$scope.sitDown = function(seat) {	
		$scope.user.profile.sitting = true;
		$scope.user.profile.seat = seat;

		$scope.table.AddPlayer($scope.user.profile.username, 1000, seat, user.uid);

		$scope.user.profile.$save();
	 	ref.child("pokertable").update(angular.fromJson(angular.toJson($scope.table)));
	}

	$scope.$on('$destroy', function(){
		
		$scope.removePlayer($scope.user.profile.seat);
		$scope.user.profile.sitting = false;
		$scope.user.profile.seat = -1;
		$scope.user.profile.$save();
		//pokerGame.$destroy();
		
		console.log('BuBye!!!');
	});

	//COMPUTER AI

	function PokerBot(table) {
	  var action = table.game.actionOn;
	  var maxBet = table.game.maxBet;
	  var thisBet = table.game.maxBet - table.game.bets[action];
	  
	  var wager = 'fold';

	  var bet = 40;

	  if ( thisBet === 0 ){ wager = 'call';}

	  switch(table.game.roundName) {
	      case 'Deal':
	        if (isDecentHand(table.players[action].cards)) {
	          if (maxBet === 0){ wager = 'raise';}
	          else { wager = 'call';}
	        }
	        break;
	      case 'Flop':
	        if (isConnectedToBoard(table.players[action].cards, table.game.board) || almostStraight(table.players[action].cards, table.game.board) || almostFlush(table.players[action].cards, table.game.board) || isPair(table.players[action].cards)) {
	          if (maxBet === 0){ wager = 'raise';}
	          else { wager = 'call';}
	        }
	        break;
	      case 'Turn':
	        if (isConnectedToBoard(table.players[action].cards, table.game.board) || almostStraight(table.players[action].cards, table.game.board) || almostFlush(table.players[action].cards, table.game.board) || isPair(table.players[action].cards)) {
	          if (maxBet === 0){ wager = 'raise';}
	          else { wager = 'call';}
	        }
	        break;
	      case 'River':
	        if (isConnectedToBoard(table.players[action].cards, table.game.board) || isPair(table.players[action].cards)){
	          if (maxBet === 0){ wager = 'raise';}
	          else { wager = 'call';}
	        }
	        break;
	      case 'Showdown':
	        wager = 'call'; //temp fix
	        break;

	  }      
	  
	  switch(wager){
	    case 'fold':
	        table.players[action].Fold(table);
	        console.log(table.players[action].playerName + " Folds");
	        break;
	    case 'call':
	        if (thisBet === 0){console.log(table.players[action].playerName + " Checks");}
	        else{console.log(table.players[action].playerName + " Calls");}
	        table.players[action].Call(table);
	        break;
	    case 'raise':
	        if (thisBet === 0 || (round === 'Deal' && maxBet === table.bigBlind) ){
	            table.players[action].Bet(bet + maxBet,table);
	            console.log(table.players[action].playerName + " Makes it " + (bet + maxBet));
	        }
	        else{ 
	            console.log(table.players[action].playerName + " Calls");
	            table.players[action].Call(table);
	        }
	        break;
	  }

	  return table;

	};

	//poker bot functions
	function allSuits(card) {
	  return [card + 'S', card + 'C', card + 'H', card + 'D'];
	};

	function isPair(cards) {
	  return cards[0][0] === cards[1][0];
	};

	function cardValue(card) {
	  return card.charAt(0);
	};

	function isPairedWithBoard(cards, communityCards) {
	  for(var i=0; i < communityCards.length; i++) {
	     if(cardValue(communityCards[i]) === cardValue(cards[0])) {
	       return true;
	     }
	     if(cardValue(communityCards[i]) === cardValue(cards[1])) {
	       return true;
	     }
	  }
	};

	function isConnectedToBoard(cards, communityCards) {
	    //console.log("Checking connected with board ...");
	  return isPairedWithBoard(cards, communityCards);
	};

	function isDecentHand(cards) {
	  //console.log("Checking Decent Hand ...");
	  var decentCardValues = ['A', 'K', 'Q', 'J', 'T', '9', '8'];
	  var decentCards = [];

	  for(var i=0; i < decentCardValues.length; i++) {
	    decentCards = decentCards.concat(allSuits(decentCardValues[i]));
	  }

	  if(decentCards.indexOf(cards[0]) !== -1 && decentCards.indexOf(cards[1]) !== -1) {
	    return true;
	    console.log("Decent Hand");
	  }

	  if(isPair(cards)) {
	    return true;
	  }

	  return false;
	};
	//
	var cardOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

	function orderCards(a, b) {
	 return cardOrder.indexOf(a[0]) - cardOrder.indexOf(b[0]);
	};

	function havePair(cards, community) {
	  var allCards = cards.concat(community).sort(orderCards);

	  for (var i=0; i<allCards.length-1; i++) {
	    if (allCards[i][0] === allCards[i+1][0]) {
	      return true;
	    }
	  }
	};

	function almostFlush(cards, community) {
	  //console.log("Checking almostFlush ...");
	  var allCards = cards.concat(community).sort(orderCards);
	  var diamonds = 0;
	  var spades = 0;
	  var clubs = 0;
	  var hearts = 0;

	  for (var i=0; i<allCards.length; i++) {
	    if (allCards[i][1] === "D") diamonds++;
	    else if (allCards[i][1] === "S") spades++;
	    else if (allCards[i][1] === "C") clubs++;
	    else hearts++;
	  }
	  //if(diamonds > 3 || spades > 3 || clubs > 3 || hearts > 3){console.log("Almost Flush!");}
	  return (diamonds > 3 || spades > 3 || clubs > 3 || hearts > 3);
	};

	function almostStraight(cards, community) {
	  //console.log("Checking almostStraight ...");
	  var allCards = cards.concat(community).sort(orderCards);

	  var count = 0;

	  for(var i=1; i < allCards.length; i++) {
	    if (cardOrder.indexOf(allCards[i][0])-1 === cardOrder.indexOf(allCards[i][0])) count++;
	    else if (count < 3) count = 0;
	  }
	  //console.log("Straight count - " + count);
	  //if(count >= 3){console.log("Almost Straight!");}
	  return count >= 3;
	};

});