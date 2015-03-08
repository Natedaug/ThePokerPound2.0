'use strict';

app.factory("Table", function() {

	function Table(smallBlind, bigBlind, minPlayers, maxPlayers, minBuyIn, maxBuyIn) {
	    this.smallBlind = smallBlind;
	    this.bigBlind = bigBlind;
	    this.minPlayers = minPlayers;
	    this.maxPlayers =  maxPlayers;
	    this.players = [];
	    this.dealer = 0; //Track the dealer position between games
	    this.minBuyIn = minBuyIn;
	    this.maxBuyIn = maxBuyIn;
	    this.game = new Game(this.smallBlind, this.bigBlind);
	    this.seats = new Array(maxPlayers); //list of empty seats
	    for(var i = 0; i < maxPlayers; i++){ this.seats[i] = false; };
	    //Validate acceptable value ranges.
	    var err;
	    if (minPlayers < 2) { //require at least two players to start a game.
	        err = new Error(101, 'Parameter [minPlayers] must be a postive integer of a minimum value of 2.');
	    } else if (maxPlayers > 10) { //hard limit of 10 players at a table.
	        err = new Error(102, 'Parameter [maxPlayers] must be a positive integer less than or equal to 10.');
	    } else if (minPlayers > maxPlayers) { //Without this we can never start a game!
	        err = new Error(103, 'Parameter [minPlayers] must be less than or equal to [maxPlayers].');
	    }

	    if (err) {
	        return err;
	    }
	}

	function Player(playerName, chips, table, seat, usr) {
	    this.playerName = playerName;
	    this.chips = chips;
	    this.folded = false;
	    this.allIn = false;
	    this.talked = false;
	    //this.table = table; //Circular reference to allow reference back to parent object.
	    this.cards = [];
	    this.cardsFlippedUp = false;
	    this.seat = seat;//player seat
	    this.user = usr;
	}



	function getMaxBet(bets) {
	    var maxBet, i;
	    maxBet = 0;
	    for (i = 0; i < bets.length; i += 1) {
	        if (bets[i] > maxBet) {
	            maxBet = bets[i];
	        }
	    }
	    return maxBet;
	}

	function checkForAllInPlayer(table, winners) {
	    var i, allInPlayer;
	    allInPlayer = [];
	    for (i = 0; i < winners.length; i += 1) {
	        if (table.players[winners[i]].allIn === true) {
	            allInPlayer.push(winners[i]);
	        }
	    }
	    return allInPlayer;
	}

	function checkForWinner(table) {
	    var i, j, k, l, maxRank, winners, part, prize, allInPlayer, minBets, roundEnd;
	    //Identify winner(s)
	    winners = [];
	    maxRank = 0.000;

	    for (k = 0; k < table.players.length; k += 1) {
	    
	        if (table.players[k].hand.rank === maxRank && table.players[k].folded === false) {
	            winners.push(k);
	        }
	        if (table.players[k].hand.rank > maxRank && table.players[k].folded === false) {
	            maxRank = table.players[k].hand.rank;
	            winners.splice(0, winners.length);
	            winners.push(k);
	        }
	    }

	    part = 0;
	    prize = 0;
	    allInPlayer = checkForAllInPlayer(table, winners);
	    if (allInPlayer.length > 0) {
	        minBets = table.game.roundBets[winners[0]];
	        for (j = 1; j < allInPlayer.length; j += 1) {
	            if (table.game.roundBets[winners[j]] !== 0 && table.game.roundBets[winners[j]] < minBets) {
	                minBets = table.game.roundBets[winners[j]];
	            }
	        }
	        part = parseInt(minBets, 10);
	    } else {
	        part = parseInt(table.game.roundBets[winners[0]], 10);

	    }
	    for (l = 0; l < table.game.roundBets.length; l += 1) {
	        if (table.game.roundBets[l] > part) {
	            prize += part;
	            table.game.roundBets[l] -= part;
	        } else {
	            prize += table.game.roundBets[l];
	            table.game.roundBets[l] = 0;
	        }
	    }

	    for (i = 0; i < winners.length; i += 1) {
	        table.players[winners[i]].chips += prize / winners.length;
	        if (table.game.roundBets[winners[i]] === 0) {
	            //table.players[winners[i]].folded = true;
	        }
	        table.game.winners += ' ' + table.players[winners[i]].playerName + ' wins !!';
	    }
	    table.game.winnersIndex = winners;

	    roundEnd = true;
	    for (l = 0; l < table.game.roundBets.length; l += 1) {
	        if (table.game.roundBets[l] !== 0) {
	            roundEnd = false;
	        }
	    }
	    if (roundEnd === false) {
	        checkForWinner(table);
	    }
	}

	function checkForBankrupt(table) {
	    var i;
	    for (i = 0; i < table.players.length; i += 1) {
	        if (table.players[i].chips === 0) {
	            console.log('player ' + table.players[i].playerName + ' is going bankrupt');
	            table.players.splice(i, 1);
	        }
	    }
	}

	function Hand(cards) {
	    this.cards = cards;
	}
	
	//sets up table for each betting round
	function startRound(table){
	    var i, failSafe = 0;
	    
	    for (i = 0; i < table.game.bets.length; i += 1) {
	        table.game.bets[i] = 0;
	    }
	    for (i = 0; i < table.players.length; i += 1) {
	        table.players[i].talked = false;
	    }
	    table.game.maxBet = 0;

	    table.game.actionEnd = table.dealer;
	    while (table.players[table.game.actionEnd].folded === true && failSafe < table.players.length) { //set action end
	        table.game.actionEnd--;
	        failSafe++;
	        if (table.game.actionEnd === -1){
	            table.game.actionEnd = table.players.length - 1;
	        }
	    } 
	    failSafe = 0;

	    table.game.actionOn = table.dealer;
	    
	    do{ //set action on
	        table.game.actionOn++;
	        failSafe++;
	        if (table.game.actionOn === table.players.length){
	            table.game.actionOn = 0;
	        }   
	    } while ((table.players[table.game.actionOn].folded === true || table.players[table.game.actionOn].allIn === true) && failSafe < table.players.length);
	    
	    var playersRemaining = 0;
	    var playersAllin = 0;
	    for (i = 0; i < table.players.length; i += 1) {
	        if (table.players[i].folded === false) {
	            playersRemaining++;
	        }
	        if(table.players[i].allIn === true){
	            playersAllin++;
	        }
	    }
	    if((playersRemaining - playersAllin) === 1){
	        table.game.actionOn = table.game.actionEnd;
	        progress(table);
	    }

	}

	function checkForEndOfRound(table) {
	    var endOfRound = false;
	    if( table.game.actionOn === table.game.actionEnd ){
	        endOfRound = true;
	        table.game.actionOn = false;
	    } else {
	        var failSafe = 0;
	        do{
	            table.game.actionOn++;
	            failSafe++;
	            if (table.game.actionOn === table.players.length){
	                table.game.actionOn = 0;
	            }   
	        } while ((table.players[table.game.actionOn].folded === true || table.players[table.game.actionOn].allIn === true) && failSafe < table.players.length);
	    }
	    return endOfRound;
	}

	function progress(table) {
	    var i, j, cards, hand;
	    if (table.game) {
	        if (checkForEndOfRound(table) === true) {
	            //Move all bets to the pot
	            for (i = 0; i < table.game.bets.length; i += 1) {
	                table.game.pot += parseInt(table.game.bets[i], 10);
	                table.game.roundBets[i] += parseInt(table.game.bets[i], 10);
	            }
	            if (table.game.roundName === 'River') {
	                console.log('effective river');
	                table.game.roundName = 'Showdown';
	                table.game.bets.splice(0, table.game.bets.length);
	                table.game.maxBet = 0;
	                //Evaluate each hand
	                for (j = 0; j < table.players.length; j += 1) {
	                    cards = table.players[j].cards.concat(table.game.board);
	                    hand = new Hand(cards);
	                    table.players[j].hand = rankHand(hand);
	                }
	                checkForWinner(table);
	                checkForBankrupt(table);
	            } else if (table.game.roundName === 'Turn') {
	                console.log('effective turn');
	                table.game.roundName = 'River';
	                table.game.deck.pop(); //Burn a card
	                table.game.board.push(table.game.deck.pop()); //Turn a card
	                
	                startRound(table);

	            } else if (table.game.roundName === 'Flop') {
	                console.log('effective flop');
	                table.game.roundName = 'Turn';
	                table.game.deck.pop(); //Burn a card
	                table.game.board.push(table.game.deck.pop()); //Turn a card
	                
	                startRound(table);

	            } else if (table.game.roundName === 'Deal') {
	                console.log('effective deal');
	                table.game.roundName = 'Flop';

	                table.game.deck.pop(); //Burn a card
	                for (i = 0; i < 3; i += 1) { //Turn three cards
	                    table.game.board.push(table.game.deck.pop());
	                }

	                startRound(table);
	                
	            }
	        }
	    }
	}

	function Game(smallBlind, bigBlind) {
	    this.smallBlind = smallBlind;
	    this.bigBlind = bigBlind;
	    this.pot = 0;
	    this.roundName = 'Deal'; //Start the first round
	    this.betName = 'bet'; //bet,raise,re-raise,cap
	    this.bets = [];
	    this.roundBets = [];
	    this.deck = [];
	    this.board = [];
	    this.winners = ''; //string of winners
	    this.winnersIndex = [];
	    this.actionOn;
	    this.actionStart;
	    this.maxBet;
	    fillDeck(this.deck);
	}

	Table.prototype.initNewRound = function () {
	    if(this.players&&this.players.length>1){
	        var i;
	        this.dealer += 1;
	        if (this.dealer >= this.players.length) {
	            this.dealer = 0;
	        }
	        this.game.pot = 0;
	        this.game.roundName = 'Deal'; //Start the first round
	        this.game.betName = 'bet'; //bet,raise,re-raise,cap
	        this.game.bets.splice(0, this.game.bets.length);
	        this.game.deck.splice(0, this.game.deck.length);
	        this.game.board.splice(0, this.game.board.length);
	        
	        for (i = 0; i < this.players.length; i += 1) {
	            this.players[i].folded = false;
	            this.players[i].talked = false;
	            this.players[i].allIn = false;
	            this.players[i].cards.splice(0, this.players[i].cards.length);
	        }
	        fillDeck(this.game.deck);
	        this.NewRound();
	    }else{
	        console.log("You need more players!");
	    }
	};

	//set seating arrangement
	function seatToPlayerIndex(seat,table){
	    for (var i = 0; i < table.players.length; i++) {
	        if(seat <= table.players[i].seat){
	           return i; 
	        }
	    }
	    return table.players.length;
	};

	//update other users
	Table.prototype.AddPlayer = function (playerName, chips, seat, usr) {
	    if (this.players.length < this.maxPlayers && chips >= this.minBuyIn && chips <= this.maxBuyIn) {
	        var player = new Player(playerName, chips, this, seat, usr);
	        var index = seatToPlayerIndex(seat,this);
	        this.seats[seat] = index; //seats taken 
	        this.players.splice(index,0,player);
	        for(var i = seat+1; i < this.seats.length; i++){
	            if(this.seats[i]||this.seats[i]===0){
	                this.seats[i]++;
	            }
	        }
	    }
	};
	Table.prototype.RemovePlayer = function (seat) {
		//if(this.game.actionOn===undefined || this.game.roundName==='Showdown') {
		    for (var i = 0; i < this.players.length; i++) {
		        if(this.players[i].seat === seat){
		            this.seats[seat] = false; //seat open
		            this.players.splice(i,1);
		            for(var i = seat; i < this.seats.length; i++){
		                if(this.seats[i]||this.seats[i]===0){
		                    this.seats[i]--;
		                }
		            }
		        }
		    }
		/*    return true;
		} else {
			console.log("Please wait til end of round to remove players")
			return false;
		}*/
	}

	Table.prototype.NewRound = function() {
	    if (this.players.length >= this.minPlayers) {
	        var i, smallBlind, bigBlind;
	        //Deal 2 cards to each player
	        for (i = 0; i < this.players.length; i += 1) {
	            this.players[i].cards.push(this.game.deck.pop());
	            this.players[i].cards.push(this.game.deck.pop());
	            this.game.bets[i] = 0;
	            this.game.roundBets[i] = 0;
	        }
	        this.game.winners = " ";
	        //Identify Small and Big Blind player indexes
	        smallBlind = this.dealer + 1;
	        if (smallBlind >= this.players.length) {
	            smallBlind = 0;
	        }
	        bigBlind = this.dealer + 2;
	        if (bigBlind >= this.players.length) {
	            bigBlind -= this.players.length;
	        }
	        if(this.players.length === 2){ //adjust for heads up play
	            smallBlind = this.dealer;
	            (this.dealer === 0) ? bigBlind = 1 : bigBlind = 0;
	        }

	        //Force Blind Bets
	        this.players[smallBlind].chips -= this.smallBlind;
	        this.players[bigBlind].chips -= this.bigBlind;
	        this.game.bets[smallBlind] = this.smallBlind;
	        this.game.bets[bigBlind] = this.bigBlind;
	        this.game.maxBet = this.bigBlind;
	        this.game.actionOn = this.dealer + 3;
	        if (this.game.actionOn >= this.players.length) {
	            this.game.actionOn -= this.players.length;
	        }
	        if(this.players.length === 2){ this.game.actionOn = smallBlind};//adjust for heads up play
	        this.game.actionEnd = bigBlind;
	        return true;
	    } else { 
	    	console.log("You need more players");
	    	return false;
	    }
	};

	Player.prototype.GetChips = function(cash) {
	    this.chips += cash;
	};

	Player.prototype.Fold = function(table) {
	    var i, bet, failSafe = 0;
	    i = seatToPlayerIndex(this.seat, table);
	        
	    if (table.game.actionOn === i && this.folded === false && this.allIn === false) {
	    //Move any current bet into the pot
            bet = table.game.bets[i];
            table.game.bets[i] = 0;
            table.game.pot += bet;
            this.talked = true;
            //Mark the player as folded
            this.folded = true;
            //Attemp to progress the game
            progress(table);
	            
	    } else {
	        console.log("It's not your turn");
	    }
	    
	};

	Player.prototype.Bet = function(bet,table) {
	    var maxBet, i, failSafe = 0;
	    maxBet = table.game.maxBet;
	    bet += maxBet;
	    i = seatToPlayerIndex(this.seat, table);
	        
        if (table.game.actionOn === i && this.folded === false && this.allIn === false) {
            if(this.chips > bet){
                table.game.bets[i] = bet;
                table.game.maxBet = bet;
                table.players[i].chips -= bet;
                table.players.talked = true;

                table.game.actionEnd = table.game.actionOn;
                do {
                    table.game.actionEnd--;
                    failSafe++;
                    if (table.game.actionEnd === -1){
                        table.game.actionEnd = table.players.length - 1;
                    }
                } while ((table.players[table.game.actionEnd].folded === true || table.players[table.game.actionEnd].allIn === true) && failSafe < table.players.length);
                //Attemp to progress the game
                progress(table);
            } else {
                console.log("You don\'t have enought chips --> ALL IN !!!");
                this.AllIn();
            }
        } else {
            console.log("It's not your turn");
        }
	    
	    
	};

	Player.prototype.Call = function(table) {
	    var maxBet, i, j, failSafe = 0;
	    maxBet = table.game.maxBet;
	    i = seatToPlayerIndex(this.seat, table);
	        
	    if (table.game.actionOn === i && this.folded === false && this.allIn === false) {
	        if (this.chips > maxBet) {
	            this.chips += table.game.bets[i];
	            this.chips -= maxBet;
	            table.game.bets[i] = maxBet;

	            this.talked = true;
	            progress(table);
	            
	        } else {
	            console.log('You don\'t have enought chips --> ALL IN !!!');
	            this.AllIn(table);
	        }
	    } else {
	        console.log("It's not your turn!!");
	    }
	};

	Player.prototype.AllIn = function(table) {
	    var i = seatToPlayerIndex(this.seat, table);
	    
        if (this === table.players[i] && table.game.actionOn === i && this.allIn === false) {
            if (table.players[i].chips !== 0) {
                table.game.bets[i] += table.players[i].chips;
                table.players[i].chips = 0;
                this.allIn = true;
                this.talked = true;
            }
        } else {
            console.log("It's not your turn!");
        }
	    

	    //Attemp to progress the game
	    progress(table);

	};

	function rankHands(hands) {
	    var x, myResult;

	    for (x = 0; x < hands.length; x += 1) {
	        myResult = rankHandInt(hands[x]);
	        hands[x].rank = myResult.rank;
	        hands[x].message = myResult.message;
	    }

	    return hands;
	};

	//HAND RANKING FUNTIONS
	function rankHand(hand) {
	    var myResult = rankHandInt(hand);
	    hand.rank = myResult.rank;
	    hand.message = myResult.message;

	    return hand;
	}

	function Result(rank, message) {
	    this.rank = rank;
	    this.message = message;
	}

	function sortNumber(a, b) {
	    return b - a;
	}

	function fillDeck(deck) {
	    deck.push('AS');
	    deck.push('KS');
	    deck.push('QS');
	    deck.push('JS');
	    deck.push('TS');
	    deck.push('9S');
	    deck.push('8S');
	    deck.push('7S');
	    deck.push('6S');
	    deck.push('5S');
	    deck.push('4S');
	    deck.push('3S');
	    deck.push('2S');
	    deck.push('AH');
	    deck.push('KH');
	    deck.push('QH');
	    deck.push('JH');
	    deck.push('TH');
	    deck.push('9H');
	    deck.push('8H');
	    deck.push('7H');
	    deck.push('6H');
	    deck.push('5H');
	    deck.push('4H');
	    deck.push('3H');
	    deck.push('2H');
	    deck.push('AD');
	    deck.push('KD');
	    deck.push('QD');
	    deck.push('JD');
	    deck.push('TD');
	    deck.push('9D');
	    deck.push('8D');
	    deck.push('7D');
	    deck.push('6D');
	    deck.push('5D');
	    deck.push('4D');
	    deck.push('3D');
	    deck.push('2D');
	    deck.push('AC');
	    deck.push('KC');
	    deck.push('QC');
	    deck.push('JC');
	    deck.push('TC');
	    deck.push('9C');
	    deck.push('8C');
	    deck.push('7C');
	    deck.push('6C');
	    deck.push('5C');
	    deck.push('4C');
	    deck.push('3C');
	    deck.push('2C');

	    //Shuffle the deck array with Fisher-Yates
	    var i, j, tempi, tempj;
	    for (i = 0; i < deck.length; i += 1) {
	        j = Math.floor(Math.random() * (i + 1));
	        tempi = deck[i];
	        tempj = deck[j];
	        deck[i] = tempj;
	        deck[j] = tempi;
	    }
	}

	function rankKickers(ranks, noOfCards) {
	    var i, kickerRank, myRanks, rank;

	    kickerRank = 0.0000;
	    myRanks = [];
	    rank = '';

	    for (i = 0; i <= ranks.length; i += 1) {
	        rank = ranks.substr(i, 1);

	        if (rank === 'A') {myRanks.push(0.2048); }
	        if (rank === 'K') {myRanks.push(0.1024); }
	        if (rank === 'Q') {myRanks.push(0.0512); }
	        if (rank === 'J') {myRanks.push(0.0256); }
	        if (rank === 'T') {myRanks.push(0.0128); }
	        if (rank === '9') {myRanks.push(0.0064); }
	        if (rank === '8') {myRanks.push(0.0032); }
	        if (rank === '7') {myRanks.push(0.0016); }
	        if (rank === '6') {myRanks.push(0.0008); }
	        if (rank === '5') {myRanks.push(0.0004); }
	        if (rank === '4') {myRanks.push(0.0002); }
	        if (rank === '3') {myRanks.push(0.0001); }
	        if (rank === '2') {myRanks.push(0.0000); }
	    }

	    myRanks.sort(sortNumber);

	    for (i = 0; i < noOfCards; i += 1) {
	        kickerRank += myRanks[i];
	    }

	    return kickerRank;
	}

	function rankHandInt(hand) {
	    var rank, message, handRanks, handSuits, ranks, suits, cards, result, i;

	    rank = 0.0000;
	    message = '';
	    handRanks = [];
	    handSuits = [];

	    for (i = 0; i < hand.cards.length; i += 1) {
	        handRanks[i] = hand.cards[i].substr(0, 1);
	        handSuits[i] = hand.cards[i].substr(1, 1);
	    }

	    ranks = handRanks.sort().toString().replace(/\W/g, "");
	    suits = handSuits.sort().toString().replace(/\W/g, "");
	    cards = hand.cards.toString();

	    //Four of a kind
	    if (rank === 0) {
	        if (ranks.indexOf('AAAA') > -1) {rank = 292 + rankKickers(ranks.replace('AAAA', ''), 1); }
	        if (ranks.indexOf('KKKK') > -1 && rank === 0) {rank = 291 + rankKickers(ranks.replace('KKKK', ''), 1); }
	        if (ranks.indexOf('QQQQ') > -1 && rank === 0) {rank = 290 + rankKickers(ranks.replace('QQQQ', ''), 1); }
	        if (ranks.indexOf('JJJJ') > -1 && rank === 0) {rank = 289 + rankKickers(ranks.replace('JJJJ', ''), 1); }
	        if (ranks.indexOf('TTTT') > -1 && rank === 0) {rank = 288 + rankKickers(ranks.replace('TTTT', ''), 1); }
	        if (ranks.indexOf('9999') > -1 && rank === 0) {rank = 287 + rankKickers(ranks.replace('9999', ''), 1); }
	        if (ranks.indexOf('8888') > -1 && rank === 0) {rank = 286 + rankKickers(ranks.replace('8888', ''), 1); }
	        if (ranks.indexOf('7777') > -1 && rank === 0) {rank = 285 + rankKickers(ranks.replace('7777', ''), 1); }
	        if (ranks.indexOf('6666') > -1 && rank === 0) {rank = 284 + rankKickers(ranks.replace('6666', ''), 1); }
	        if (ranks.indexOf('5555') > -1 && rank === 0) {rank = 283 + rankKickers(ranks.replace('5555', ''), 1); }
	        if (ranks.indexOf('4444') > -1 && rank === 0) {rank = 282 + rankKickers(ranks.replace('4444', ''), 1); }
	        if (ranks.indexOf('3333') > -1 && rank === 0) {rank = 281 + rankKickers(ranks.replace('3333', ''), 1); }
	        if (ranks.indexOf('2222') > -1 && rank === 0) {rank = 280 + rankKickers(ranks.replace('2222', ''), 1); }
	        if (rank !== 0) {message = 'Four of a kind'; }
	    }

	    //Full House
	    if (rank === 0) {
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('KK') > -1) {rank = 279; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 278; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 277; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 276; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 275; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 274; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 273; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 272; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 271; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 270; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 269; }
	        if (ranks.indexOf('AAA') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 268; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 267; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 266; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 265; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 264; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 263; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 262; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 261; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 260; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 259; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 258; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 257; }
	        if (ranks.indexOf('KKK') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 256; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 255; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 254; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 253; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 252; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 251; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 250; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 249; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 248; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 247; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 246; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 245; }
	        if (ranks.indexOf('QQQ') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 244; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 243; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 242; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 241; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 240; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 239; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 238; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 237; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 236; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 235; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 234; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 233; }
	        if (ranks.indexOf('JJJ') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 232; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 231; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 230; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 229; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 228; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 227; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 226; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 225; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 224; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 223; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 222; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 221; }
	        if (ranks.indexOf('TTT') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 220; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 219; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 218; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 217; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 216; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 215; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 214; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 213; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 212; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 211; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 210; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 209; }
	        if (ranks.indexOf('999') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 208; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 207; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 206; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 205; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 204; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 203; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 202; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 201; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 200; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 199; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 198; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 197; }
	        if (ranks.indexOf('888') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 196; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 195; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 194; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 193; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 192; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 191; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 190; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 189; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 188; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 187; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 186; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 185; }
	        if (ranks.indexOf('777') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 184; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 183; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 182; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 181; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 180; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 179; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 178; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 177; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 176; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 175; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 174; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 173; }
	        if (ranks.indexOf('666') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 172; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 171; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 170; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 169; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 168; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 167; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 166; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 165; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 164; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 163; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 162; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 161; }
	        if (ranks.indexOf('555') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 160; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 159; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 158; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 157; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 156; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 155; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 154; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 153; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 152; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 151; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 150; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 149; }
	        if (ranks.indexOf('444') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 148; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 147; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 146; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 145; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 144; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 143; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 142; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 141; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 140; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 139; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 138; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 137; }
	        if (ranks.indexOf('333') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 136; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('AA') > -1 && rank === 0) {rank = 135; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('KK') > -1 && rank === 0) {rank = 134; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 133; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 132; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 131; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 130; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 129; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 128; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 127; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 126; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 125; }
	        if (ranks.indexOf('222') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 124; }
	        if (rank !== 0) {message = 'Full House'; }
	    }

	    //Flush
	    if (rank === 0) {
	        if (suits.indexOf('CCCCC') > -1 || suits.indexOf('DDDDD') > -1 || suits.indexOf('HHHHH') > -1 || suits.indexOf('SSSSS') > -1) {rank = 123; message = 'Flush';}

	        //Straight flush
	        if (cards.indexOf('TC') > -1 && cards.indexOf('JC') > -1 && cards.indexOf('QC') > -1 && cards.indexOf('KC') > -1 && cards.indexOf('AC') > -1 && rank === 123) {rank = 302; message = 'Straight Flush';}
	        if (cards.indexOf('TD') > -1 && cards.indexOf('JD') > -1 && cards.indexOf('QD') > -1 && cards.indexOf('KD') > -1 && cards.indexOf('AD') > -1 && rank === 123) {rank = 302; message = 'Straight Flush';}
	        if (cards.indexOf('TH') > -1 && cards.indexOf('JH') > -1 && cards.indexOf('QH') > -1 && cards.indexOf('KH') > -1 && cards.indexOf('AH') > -1 && rank === 123) {rank = 302; message = 'Straight Flush';}
	        if (cards.indexOf('TS') > -1 && cards.indexOf('JS') > -1 && cards.indexOf('QS') > -1 && cards.indexOf('KS') > -1 && cards.indexOf('AS') > -1 && rank === 123) {rank = 302; message = 'Straight Flush';}
	        if (cards.indexOf('9C') > -1 && cards.indexOf('TC') > -1 && cards.indexOf('JC') > -1 && cards.indexOf('QC') > -1 && cards.indexOf('KC') > -1 && rank === 123) {rank = 301; message = 'Straight Flush';}
	        if (cards.indexOf('9D') > -1 && cards.indexOf('TD') > -1 && cards.indexOf('JD') > -1 && cards.indexOf('QD') > -1 && cards.indexOf('KD') > -1 && rank === 123) {rank = 301; message = 'Straight Flush';}
	        if (cards.indexOf('9H') > -1 && cards.indexOf('TH') > -1 && cards.indexOf('JH') > -1 && cards.indexOf('QH') > -1 && cards.indexOf('KH') > -1 && rank === 123) {rank = 301; message = 'Straight Flush';}
	        if (cards.indexOf('9S') > -1 && cards.indexOf('TS') > -1 && cards.indexOf('JS') > -1 && cards.indexOf('QS') > -1 && cards.indexOf('KS') > -1 && rank === 123) {rank = 301; message = 'Straight Flush';}
	        if (cards.indexOf('8C') > -1 && cards.indexOf('9C') > -1 && cards.indexOf('TC') > -1 && cards.indexOf('JC') > -1 && cards.indexOf('QC') > -1 && rank === 123) {rank = 300; message = 'Straight Flush';}
	        if (cards.indexOf('8D') > -1 && cards.indexOf('9D') > -1 && cards.indexOf('TD') > -1 && cards.indexOf('JD') > -1 && cards.indexOf('QD') > -1 && rank === 123) {rank = 300; message = 'Straight Flush';}
	        if (cards.indexOf('8H') > -1 && cards.indexOf('9H') > -1 && cards.indexOf('TH') > -1 && cards.indexOf('JH') > -1 && cards.indexOf('QH') > -1 && rank === 123) {rank = 300; message = 'Straight Flush';}
	        if (cards.indexOf('8S') > -1 && cards.indexOf('9S') > -1 && cards.indexOf('TS') > -1 && cards.indexOf('JS') > -1 && cards.indexOf('QS') > -1 && rank === 123) {rank = 300; message = 'Straight Flush';}
	        if (cards.indexOf('7C') > -1 && cards.indexOf('8C') > -1 && cards.indexOf('9C') > -1 && cards.indexOf('TC') > -1 && cards.indexOf('JC') > -1 && rank === 123) {rank = 299; message = 'Straight Flush';}
	        if (cards.indexOf('7D') > -1 && cards.indexOf('8D') > -1 && cards.indexOf('9D') > -1 && cards.indexOf('TD') > -1 && cards.indexOf('JD') > -1 && rank === 123) {rank = 299; message = 'Straight Flush';}
	        if (cards.indexOf('7H') > -1 && cards.indexOf('8H') > -1 && cards.indexOf('9H') > -1 && cards.indexOf('TH') > -1 && cards.indexOf('JH') > -1 && rank === 123) {rank = 299; message = 'Straight Flush';}
	        if (cards.indexOf('7S') > -1 && cards.indexOf('8S') > -1 && cards.indexOf('9S') > -1 && cards.indexOf('TS') > -1 && cards.indexOf('JS') > -1 && rank === 123) {rank = 299; message = 'Straight Flush';}
	        if (cards.indexOf('6C') > -1 && cards.indexOf('7C') > -1 && cards.indexOf('8C') > -1 && cards.indexOf('9C') > -1 && cards.indexOf('TC') > -1 && rank === 123) {rank = 298; message = 'Straight Flush';}
	        if (cards.indexOf('6D') > -1 && cards.indexOf('7D') > -1 && cards.indexOf('8D') > -1 && cards.indexOf('9D') > -1 && cards.indexOf('TD') > -1 && rank === 123) {rank = 298; message = 'Straight Flush';}
	        if (cards.indexOf('6H') > -1 && cards.indexOf('7H') > -1 && cards.indexOf('8H') > -1 && cards.indexOf('9H') > -1 && cards.indexOf('TH') > -1 && rank === 123) {rank = 298; message = 'Straight Flush';}
	        if (cards.indexOf('6S') > -1 && cards.indexOf('7S') > -1 && cards.indexOf('8S') > -1 && cards.indexOf('9S') > -1 && cards.indexOf('TS') > -1 && rank === 123) {rank = 298; message = 'Straight Flush';}
	        if (cards.indexOf('5C') > -1 && cards.indexOf('6C') > -1 && cards.indexOf('7C') > -1 && cards.indexOf('8C') > -1 && cards.indexOf('9C') > -1 && rank === 123) {rank = 297; message = 'Straight Flush';}
	        if (cards.indexOf('5D') > -1 && cards.indexOf('6D') > -1 && cards.indexOf('7D') > -1 && cards.indexOf('8D') > -1 && cards.indexOf('9D') > -1 && rank === 123) {rank = 297; message = 'Straight Flush';}
	        if (cards.indexOf('5H') > -1 && cards.indexOf('6H') > -1 && cards.indexOf('7H') > -1 && cards.indexOf('8H') > -1 && cards.indexOf('9H') > -1 && rank === 123) {rank = 297; message = 'Straight Flush';}
	        if (cards.indexOf('5S') > -1 && cards.indexOf('6S') > -1 && cards.indexOf('7S') > -1 && cards.indexOf('8S') > -1 && cards.indexOf('9S') > -1 && rank === 123) {rank = 297; message = 'Straight Flush';}
	        if (cards.indexOf('4C') > -1 && cards.indexOf('5C') > -1 && cards.indexOf('6C') > -1 && cards.indexOf('7C') > -1 && cards.indexOf('8C') > -1 && rank === 123) {rank = 296; message = 'Straight Flush';}
	        if (cards.indexOf('4D') > -1 && cards.indexOf('5D') > -1 && cards.indexOf('6D') > -1 && cards.indexOf('7D') > -1 && cards.indexOf('8D') > -1 && rank === 123) {rank = 296; message = 'Straight Flush';}
	        if (cards.indexOf('4H') > -1 && cards.indexOf('5H') > -1 && cards.indexOf('6H') > -1 && cards.indexOf('7H') > -1 && cards.indexOf('8H') > -1 && rank === 123) {rank = 296; message = 'Straight Flush';}
	        if (cards.indexOf('4S') > -1 && cards.indexOf('5S') > -1 && cards.indexOf('6S') > -1 && cards.indexOf('7S') > -1 && cards.indexOf('8S') > -1 && rank === 123) {rank = 296; message = 'Straight Flush';}
	        if (cards.indexOf('3C') > -1 && cards.indexOf('4C') > -1 && cards.indexOf('5C') > -1 && cards.indexOf('6C') > -1 && cards.indexOf('7C') > -1 && rank === 123) {rank = 295; message = 'Straight Flush';}
	        if (cards.indexOf('3D') > -1 && cards.indexOf('4D') > -1 && cards.indexOf('5D') > -1 && cards.indexOf('6D') > -1 && cards.indexOf('7D') > -1 && rank === 123) {rank = 295; message = 'Straight Flush';}
	        if (cards.indexOf('3H') > -1 && cards.indexOf('4H') > -1 && cards.indexOf('5H') > -1 && cards.indexOf('6H') > -1 && cards.indexOf('7H') > -1 && rank === 123) {rank = 295; message = 'Straight Flush';}
	        if (cards.indexOf('3S') > -1 && cards.indexOf('4S') > -1 && cards.indexOf('5S') > -1 && cards.indexOf('6S') > -1 && cards.indexOf('7S') > -1 && rank === 123) {rank = 295; message = 'Straight Flush';}
	        if (cards.indexOf('2C') > -1 && cards.indexOf('3C') > -1 && cards.indexOf('4C') > -1 && cards.indexOf('5C') > -1 && cards.indexOf('6C') > -1 && rank === 123) {rank = 294; message = 'Straight Flush';}
	        if (cards.indexOf('2D') > -1 && cards.indexOf('3D') > -1 && cards.indexOf('4D') > -1 && cards.indexOf('5D') > -1 && cards.indexOf('6D') > -1 && rank === 123) {rank = 294; message = 'Straight Flush';}
	        if (cards.indexOf('2H') > -1 && cards.indexOf('3H') > -1 && cards.indexOf('4H') > -1 && cards.indexOf('5H') > -1 && cards.indexOf('6H') > -1 && rank === 123) {rank = 294; message = 'Straight Flush';}
	        if (cards.indexOf('2S') > -1 && cards.indexOf('3S') > -1 && cards.indexOf('4S') > -1 && cards.indexOf('5S') > -1 && cards.indexOf('6S') > -1 && rank === 123) {rank = 294; message = 'Straight Flush';}
	        if (cards.indexOf('AC') > -1 && cards.indexOf('2C') > -1 && cards.indexOf('3C') > -1 && cards.indexOf('4C') > -1 && cards.indexOf('5C') > -1 && rank === 123) {rank = 293; message = 'Straight Flush';}
	        if (cards.indexOf('AS') > -1 && cards.indexOf('2S') > -1 && cards.indexOf('3S') > -1 && cards.indexOf('4S') > -1 && cards.indexOf('5S') > -1 && rank === 123) {rank = 293; message = 'Straight Flush';}
	        if (cards.indexOf('AH') > -1 && cards.indexOf('2H') > -1 && cards.indexOf('3H') > -1 && cards.indexOf('4H') > -1 && cards.indexOf('5H') > -1 && rank === 123) {rank = 293; message = 'Straight Flush';}
	        if (cards.indexOf('AD') > -1 && cards.indexOf('2D') > -1 && cards.indexOf('3D') > -1 && cards.indexOf('4D') > -1 && cards.indexOf('5D') > -1 && rank === 123) {rank = 293; message = 'Straight Flush';}
	        if (rank === 123) {rank = rank + rankKickers(ranks, 5);} 

	    }

	    //Straight
	    if (rank === 0) {
	        if (cards.indexOf('T') > -1 && cards.indexOf('J') > -1 && cards.indexOf('Q') > -1 && cards.indexOf('K') > -1 && cards.indexOf('A') > -1) {rank = 122; }
	        if (cards.indexOf('9') > -1 && cards.indexOf('T') > -1 && cards.indexOf('J') > -1 && cards.indexOf('Q') > -1 && cards.indexOf('K') > -1 && rank === 0) {rank = 121; }
	        if (cards.indexOf('8') > -1 && cards.indexOf('9') > -1 && cards.indexOf('T') > -1 && cards.indexOf('J') > -1 && cards.indexOf('Q') > -1 && rank === 0) {rank = 120; }
	        if (cards.indexOf('7') > -1 && cards.indexOf('8') > -1 && cards.indexOf('9') > -1 && cards.indexOf('T') > -1 && cards.indexOf('J') > -1 && rank === 0) {rank = 119; }
	        if (cards.indexOf('6') > -1 && cards.indexOf('7') > -1 && cards.indexOf('8') > -1 && cards.indexOf('9') > -1 && cards.indexOf('T') > -1 && rank === 0) {rank = 118; }
	        if (cards.indexOf('5') > -1 && cards.indexOf('6') > -1 && cards.indexOf('7') > -1 && cards.indexOf('8') > -1 && cards.indexOf('9') > -1 && rank === 0) {rank = 117; }
	        if (cards.indexOf('4') > -1 && cards.indexOf('5') > -1 && cards.indexOf('6') > -1 && cards.indexOf('7') > -1 && cards.indexOf('8') > -1 && rank === 0) {rank = 116; }
	        if (cards.indexOf('3') > -1 && cards.indexOf('4') > -1 && cards.indexOf('5') > -1 && cards.indexOf('6') > -1 && cards.indexOf('7') > -1 && rank === 0) {rank = 115; }
	        if (cards.indexOf('2') > -1 && cards.indexOf('3') > -1 && cards.indexOf('4') > -1 && cards.indexOf('5') > -1 && cards.indexOf('6') > -1 && rank === 0) {rank = 114; }
	        if (cards.indexOf('A') > -1 && cards.indexOf('2') > -1 && cards.indexOf('3') > -1 && cards.indexOf('4') > -1 && cards.indexOf('5') > -1 && rank === 0) {rank = 113; }
	        if (rank !== 0) {message = 'Straight'; }
	    }

	    //Three of a kind
	    if (rank === 0) {
	        if (ranks.indexOf('AAA') > -1) {rank = 112 + rankKickers(ranks.replace('AAA', ''), 2); }
	        if (ranks.indexOf('KKK') > -1 && rank === 0) {rank = 111 + rankKickers(ranks.replace('KKK', ''), 2); }
	        if (ranks.indexOf('QQQ') > -1 && rank === 0) {rank = 110 + rankKickers(ranks.replace('QQQ', ''), 2); }
	        if (ranks.indexOf('JJJ') > -1 && rank === 0) {rank = 109 + rankKickers(ranks.replace('JJJ', ''), 2); }
	        if (ranks.indexOf('TTT') > -1 && rank === 0) {rank = 108 + rankKickers(ranks.replace('TTT', ''), 2); }
	        if (ranks.indexOf('999') > -1 && rank === 0) {rank = 107 + rankKickers(ranks.replace('999', ''), 2); }
	        if (ranks.indexOf('888') > -1 && rank === 0) {rank = 106 + rankKickers(ranks.replace('888', ''), 2); }
	        if (ranks.indexOf('777') > -1 && rank === 0) {rank = 105 + rankKickers(ranks.replace('777', ''), 2); }
	        if (ranks.indexOf('666') > -1 && rank === 0) {rank = 104 + rankKickers(ranks.replace('666', ''), 2); }
	        if (ranks.indexOf('555') > -1 && rank === 0) {rank = 103 + rankKickers(ranks.replace('555', ''), 2); }
	        if (ranks.indexOf('444') > -1 && rank === 0) {rank = 102 + rankKickers(ranks.replace('444', ''), 2); }
	        if (ranks.indexOf('333') > -1 && rank === 0) {rank = 101 + rankKickers(ranks.replace('333', ''), 2); }
	        if (ranks.indexOf('222') > -1 && rank === 0) {rank = 100 + rankKickers(ranks.replace('222', ''), 2); }
	        if (rank !== 0) {message = 'Three of a Kind'; }
	    }

	    //Two pair
	    if (rank === 0) {
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('KK') > -1) {rank = 99 + rankKickers(ranks.replace('AA', '').replace('KK', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 98 + rankKickers(ranks.replace('AA', '').replace('QQ', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 97 + rankKickers(ranks.replace('AA', '').replace('JJ', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 96 + rankKickers(ranks.replace('AA', '').replace('TT', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 95 + rankKickers(ranks.replace('AA', '').replace('99', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 94 + rankKickers(ranks.replace('AA', '').replace('88', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 93 + rankKickers(ranks.replace('AA', '').replace('77', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 92 + rankKickers(ranks.replace('AA', '').replace('66', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 91 + rankKickers(ranks.replace('AA', '').replace('55', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 90 + rankKickers(ranks.replace('AA', '').replace('44', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 89 + rankKickers(ranks.replace('AA', '').replace('33', ''), 1); }
	        if (ranks.indexOf('AA') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 88 + rankKickers(ranks.replace('AA', '').replace('22', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('QQ') > -1 && rank === 0) {rank = 87 + rankKickers(ranks.replace('KK', '').replace('QQ', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 86 + rankKickers(ranks.replace('KK', '').replace('JJ', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 85 + rankKickers(ranks.replace('KK', '').replace('TT', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 84 + rankKickers(ranks.replace('KK', '').replace('99', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 83 + rankKickers(ranks.replace('KK', '').replace('88', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 82 + rankKickers(ranks.replace('KK', '').replace('77', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 81 + rankKickers(ranks.replace('KK', '').replace('66', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 80 + rankKickers(ranks.replace('KK', '').replace('55', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 79 + rankKickers(ranks.replace('KK', '').replace('44', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 78 + rankKickers(ranks.replace('KK', '').replace('33', ''), 1); }
	        if (ranks.indexOf('KK') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 77 + rankKickers(ranks.replace('KK', '').replace('22', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('JJ') > -1 && rank === 0) {rank = 76 + rankKickers(ranks.replace('QQ', '').replace('JJ', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 75 + rankKickers(ranks.replace('QQ', '').replace('TT', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 74 + rankKickers(ranks.replace('QQ', '').replace('99', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 73 + rankKickers(ranks.replace('QQ', '').replace('88', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 72 + rankKickers(ranks.replace('QQ', '').replace('77', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 71 + rankKickers(ranks.replace('QQ', '').replace('66', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 70 + rankKickers(ranks.replace('QQ', '').replace('55', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 69 + rankKickers(ranks.replace('QQ', '').replace('44', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 68 + rankKickers(ranks.replace('QQ', '').replace('33', ''), 1); }
	        if (ranks.indexOf('QQ') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 67 + rankKickers(ranks.replace('QQ', '').replace('22', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('TT') > -1 && rank === 0) {rank = 66 + rankKickers(ranks.replace('JJ', '').replace('TT', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 65 + rankKickers(ranks.replace('JJ', '').replace('99', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 64 + rankKickers(ranks.replace('JJ', '').replace('88', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 63 + rankKickers(ranks.replace('JJ', '').replace('77', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 62 + rankKickers(ranks.replace('JJ', '').replace('66', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 61 + rankKickers(ranks.replace('JJ', '').replace('55', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 60 + rankKickers(ranks.replace('JJ', '').replace('44', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 59 + rankKickers(ranks.replace('JJ', '').replace('33', ''), 1); }
	        if (ranks.indexOf('JJ') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 58 + rankKickers(ranks.replace('JJ', '').replace('22', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('99') > -1 && rank === 0) {rank = 57 + rankKickers(ranks.replace('TT', '').replace('99', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 56 + rankKickers(ranks.replace('TT', '').replace('88', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 55 + rankKickers(ranks.replace('TT', '').replace('77', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 54 + rankKickers(ranks.replace('TT', '').replace('66', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 53 + rankKickers(ranks.replace('TT', '').replace('55', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 52 + rankKickers(ranks.replace('TT', '').replace('44', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 51 + rankKickers(ranks.replace('TT', '').replace('33', ''), 1); }
	        if (ranks.indexOf('TT') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 50 + rankKickers(ranks.replace('TT', '').replace('22', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('88') > -1 && rank === 0) {rank = 49 + rankKickers(ranks.replace('99', '').replace('88', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 48 + rankKickers(ranks.replace('99', '').replace('77', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 47 + rankKickers(ranks.replace('99', '').replace('66', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 46 + rankKickers(ranks.replace('99', '').replace('55', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 45 + rankKickers(ranks.replace('99', '').replace('44', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 44 + rankKickers(ranks.replace('99', '').replace('33', ''), 1); }
	        if (ranks.indexOf('99') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 43 + rankKickers(ranks.replace('99', '').replace('22', ''), 1); }
	        if (ranks.indexOf('88') > -1 && ranks.indexOf('77') > -1 && rank === 0) {rank = 42 + rankKickers(ranks.replace('88', '').replace('77', ''), 1); }
	        if (ranks.indexOf('88') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 41 + rankKickers(ranks.replace('88', '').replace('66', ''), 1); }
	        if (ranks.indexOf('88') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 40 + rankKickers(ranks.replace('88', '').replace('55', ''), 1); }
	        if (ranks.indexOf('88') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 39 + rankKickers(ranks.replace('88', '').replace('44', ''), 1); }
	        if (ranks.indexOf('88') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 38 + rankKickers(ranks.replace('88', '').replace('33', ''), 1); }
	        if (ranks.indexOf('88') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 37 + rankKickers(ranks.replace('88', '').replace('22', ''), 1); }
	        if (ranks.indexOf('77') > -1 && ranks.indexOf('66') > -1 && rank === 0) {rank = 36 + rankKickers(ranks.replace('77', '').replace('66', ''), 1); }
	        if (ranks.indexOf('77') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 35 + rankKickers(ranks.replace('77', '').replace('55', ''), 1); }
	        if (ranks.indexOf('77') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 34 + rankKickers(ranks.replace('77', '').replace('44', ''), 1); }
	        if (ranks.indexOf('77') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 33 + rankKickers(ranks.replace('77', '').replace('33', ''), 1); }
	        if (ranks.indexOf('77') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 32 + rankKickers(ranks.replace('77', '').replace('22', ''), 1); }
	        if (ranks.indexOf('66') > -1 && ranks.indexOf('55') > -1 && rank === 0) {rank = 31 + rankKickers(ranks.replace('66', '').replace('55', ''), 1); }
	        if (ranks.indexOf('66') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 30 + rankKickers(ranks.replace('66', '').replace('44', ''), 1); }
	        if (ranks.indexOf('66') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 29 + rankKickers(ranks.replace('66', '').replace('33', ''), 1); }
	        if (ranks.indexOf('66') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 28 + rankKickers(ranks.replace('66', '').replace('22', ''), 1); }
	        if (ranks.indexOf('55') > -1 && ranks.indexOf('44') > -1 && rank === 0) {rank = 27 + rankKickers(ranks.replace('55', '').replace('44', ''), 1); }
	        if (ranks.indexOf('55') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 26 + rankKickers(ranks.replace('55', '').replace('33', ''), 1); }
	        if (ranks.indexOf('55') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 25 + rankKickers(ranks.replace('55', '').replace('22', ''), 1); }
	        if (ranks.indexOf('44') > -1 && ranks.indexOf('33') > -1 && rank === 0) {rank = 24 + rankKickers(ranks.replace('44', '').replace('33', ''), 1); }
	        if (ranks.indexOf('44') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 23 + rankKickers(ranks.replace('44', '').replace('22', ''), 1); }
	        if (ranks.indexOf('33') > -1 && ranks.indexOf('22') > -1 && rank === 0) {rank = 22 + rankKickers(ranks.replace('33', '').replace('22', ''), 1); }
	        if (rank !== 0) {message = 'Two Pair'; }
	    }

	    //One Pair
	    if (rank === 0) {
	        if (ranks.indexOf('AA') > -1) {rank = 21 + rankKickers(ranks.replace('AA', ''), 3); }
	        if (ranks.indexOf('KK') > -1 && rank === 0) {rank = 20 + rankKickers(ranks.replace('KK', ''), 3); }
	        if (ranks.indexOf('QQ') > -1 && rank === 0) {rank = 19 + rankKickers(ranks.replace('QQ', ''), 3); }
	        if (ranks.indexOf('JJ') > -1 && rank === 0) {rank = 18 + rankKickers(ranks.replace('JJ', ''), 3); }
	        if (ranks.indexOf('TT') > -1 && rank === 0) {rank = 17 + rankKickers(ranks.replace('TT', ''), 3); }
	        if (ranks.indexOf('99') > -1 && rank === 0) {rank = 16 + rankKickers(ranks.replace('99', ''), 3); }
	        if (ranks.indexOf('88') > -1 && rank === 0) {rank = 15 + rankKickers(ranks.replace('88', ''), 3); }
	        if (ranks.indexOf('77') > -1 && rank === 0) {rank = 14 + rankKickers(ranks.replace('77', ''), 3); }
	        if (ranks.indexOf('66') > -1 && rank === 0) {rank = 13 + rankKickers(ranks.replace('66', ''), 3); }
	        if (ranks.indexOf('55') > -1 && rank === 0) {rank = 12 + rankKickers(ranks.replace('55', ''), 3); }
	        if (ranks.indexOf('44') > -1 && rank === 0) {rank = 11 + rankKickers(ranks.replace('44', ''), 3); }
	        if (ranks.indexOf('33') > -1 && rank === 0) {rank = 10 + rankKickers(ranks.replace('33', ''), 3); }
	        if (ranks.indexOf('22') > -1 && rank === 0) {rank = 9 + rankKickers(ranks.replace('22', ''), 3); }
	        if (rank !== 0) {message = 'Pair'; }
	    }

	    //High Card
	    if (rank === 0) {
	        if (ranks.indexOf('A') > -1) {rank = 8 + rankKickers(ranks.replace('A', ''), 4); }
	        if (ranks.indexOf('K') > -1 && rank === 0) {rank = 7 + rankKickers(ranks.replace('K', ''), 4); }
	        if (ranks.indexOf('Q') > -1 && rank === 0) {rank = 6 + rankKickers(ranks.replace('Q', ''), 4); }
	        if (ranks.indexOf('J') > -1 && rank === 0) {rank = 5 + rankKickers(ranks.replace('J', ''), 4); }
	        if (ranks.indexOf('T') > -1 && rank === 0) {rank = 4 + rankKickers(ranks.replace('T', ''), 4); }
	        if (ranks.indexOf('9') > -1 && rank === 0) {rank = 3 + rankKickers(ranks.replace('9', ''), 4); }
	        if (ranks.indexOf('8') > -1 && rank === 0) {rank = 2 + rankKickers(ranks.replace('8', ''), 4); }
	        if (ranks.indexOf('7') > -1 && rank === 0) {rank = 1 + rankKickers(ranks.replace('7', ''), 4); }
	        if (rank !== 0) {message = 'High Card'; }
	    }

	    result = new Result(rank, message);

	    return result;
	}

	return Table;

});