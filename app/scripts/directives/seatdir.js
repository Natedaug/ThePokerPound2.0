'use strict';

app.directive('seat', function (){
	return{
		restrict: 'E',
		transclude: true,
		scope: {
            index: '@',
            length: '@',
            wager: '@'
        },
		link: function(scope, element, attrs) {
	           
	        var noOfCircles = attrs.length;
	        /* equally divide 360 by the no of circles to be drawn */
	        var degreeAngle = 6.2831853 / noOfCircles;
	        /* get handle on the wrapper canvas */
	        var wrapper = element;
	        /* clear it first */
	        
	        /* initialize angle incrementer variable */
	        var currAngle = degreeAngle*attrs.index;

	        function getR(currAngle){
		    	var r = ( (25*12.5) / Math.sqrt( (Math.pow(25,2) * Math.pow(Math.sin(currAngle),2)) + (Math.pow(12.5,2) * Math.pow(Math.cos(currAngle),2)) ) );
		    	
		    	return r;
		    }
		    
	        //adjust for even distribution around perimeter
	        if(attrs.index===1){
	        	//currAngle -= (degreeAngle);
	        }
	        else if(attrs.index===2){
	        	currAngle -= (degreeAngle/22);
	        }
	        else if(attrs.index===3){
	        	currAngle += (currAngle/10);
	        }
	        else if(attrs.index===4){
	        	currAngle += (degreeAngle/4);
	        }
	        else if(attrs.index===6){
	        	currAngle -= (degreeAngle/3);
	        }
	        else if(attrs.index===7){
	        	currAngle -= (degreeAngle/4);
	        }
	        else if(attrs.index===8){
	        	currAngle += (degreeAngle/5);
	        }
	        else if(attrs.index===9){
	        	currAngle += (degreeAngle/4);
	        }

	        wrapper.css({
	            transform: 'rotate(' + currAngle + 'rad) translate('+getR(currAngle)+'em) rotate(' + -currAngle + 'rad)'
	        });
	            	    
		    /*
		        Function returns a new DIV with the angles translation using CSS.
		        It also applies a random color for fun.
		        stole the CSS from :http://stackoverflow.com/questions/12813573/position-icons-into-circle
		    
		    function getDiv(currAngle,i) {
		        return '<div class="seat" id="seat'+i+'" style="transform: rotate(' + currAngle + 'rad) translate('+getR(currAngle)+'em) rotate(' + -currAngle + 'rad);" >'+'<div> Seat '+(i+1)+' </div><button class="btn btn-small">sit</button></div>';

		    }
		    */
	      
		}
	};
});