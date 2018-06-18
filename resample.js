var URL_PARAM = window.location.href.split("?")[1];

///////////////////
// GET CSV DATA. //
///////////////////

var promiseGetCSV = function(pathname){
	return new Promise(function(resolve){
		var r = new XMLHttpRequest();
		r.open("GET", pathname, true);
		r.onreadystatechange = function () {
			if(r.readyState!=4 || r.status!=200) return;

			// Parse data
			var rows = r.responseText.split("\n");
			rows.shift(); // remove header row
			rows.forEach(function(data, i){
				rows[i] = data.split(",");
				rows[i].forEach(function(num, j){
					rows[i][j] = parseInt(num);
				});
			});
			resolve(rows);

		};
		r.send();
	});
};
var promiseGetPatreon = promiseGetCSV("csv/Patreon.csv");
var promiseGetTwitter = promiseGetCSV("csv/Twitter.csv");

Promise.all([promiseGetPatreon, promiseGetTwitter]).then(function(values){

	//////////////////////////////////////////////////////////
	// Finally, we can actually do some statistics on this. //
	//////////////////////////////////////////////////////////

	var patreonData = values[0];
	var twitterData = values[1];
	var allData = patreonData.concat(twitterData);

	var theData;
	if(URL_PARAM=="twitter") theData=twitterData;
	else if(URL_PARAM=="patreon") theData=patreonData;
	else theData=allData;

	// INTO COLUMNS, DAMN IT.
	var columns = {
		        web: getColumn(theData,0),
		  web_skill: getColumn(theData,1),
		      write: getColumn(theData,2),
		write_skill: getColumn(theData,3),
		      stats: getColumn(theData,4),
		stats_skill: getColumn(theData,5),
		      learn: getColumn(theData,6),
		learn_skill: getColumn(theData,7)
	};

	// DRAW CONFIDENCE INTERVALS
	drawCI("        web", columns.web );
	drawCI("      write", columns.write );
	drawCI("      stats", columns.stats );
	drawCI("      learn", columns.learn );
	drawCI("  web_skill", columns.web_skill );
	drawCI("write_skill", columns.write_skill );
	drawCI("stats_skill", columns.stats_skill );
	drawCI("learn_skill", columns.learn_skill );

});

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

var canvas = document.getElementById("canvas");
canvas.width = canvas.height = 1000;
canvas.style.width = canvas.style.height = 500;
var ctx = canvas.getContext("2d");
ctx.scale(2,2);

ctx.strokeStyle = "#ddd";
ctx.beginPath();
var xx = 180;
for(var i=0; i<6; i++){
	ctx.moveTo(xx, 0);
	ctx.lineTo(xx, 500);
	xx += 60;
}
ctx.stroke();

var BAR_COLOR;
if(URL_PARAM=="twitter"){
	BAR_COLOR = "#1da1f2";
}else if(URL_PARAM=="patreon"){
	BAR_COLOR = "#f96854";
}else{
	BAR_COLOR = "#bbb";
}

var lineY = 50;
function drawCI(name, data){

	var CI = resampleGetCIMean(data, 0.95, 5000);

	// Label
	ctx.translate(0, lineY);
	ctx.font = "20px monospace";
	ctx.textAlign = "start";
	ctx.fillStyle = "#000";
	ctx.fillText(name,20,0);

	// Box
	var left = 180;
	var width = 300;
	var x = left + (CI.avg/5)*width;
	var x1 = left + (CI.low/5)*width;
	var x2 = left + (CI.high/5)*width;
	
	ctx.fillStyle = BAR_COLOR;
	ctx.beginPath();
	ctx.rect(x1, -5, x2-x1, 10);
	ctx.fill();

	ctx.strokeStyle = "rgba(0,0,0,0.5)";
	ctx.beginPath();
	ctx.moveTo(x, -5);
	ctx.lineTo(x, 5);
	ctx.stroke();

	// Text
	ctx.font = "12px monospace";
	ctx.textAlign = "center";
	ctx.fillStyle = "#aaa";
	var label = CI.avg + "±" + CI.plusMinus;
	ctx.fillText(label,x,-7);

}

function getColumn(allData, columnIndex){
	var newData = [];
	for(var rowIndex=0; rowIndex<allData.length; rowIndex++){
		var value = allData[rowIndex][columnIndex];
		newData.push(value);
	}
	return newData;
}

// RESAMPLE
function resampleGetCIMean(data, ci, iterations){
	var means = [];
	for(var i=0; i<iterations; i++){
		var sample = resample(data);
		var mean = average(sample);
		means.push(mean);
	}
	means.sort();
	var loIndex = Math.round( (0.5-ci/2) * iterations );
	var hiIndex = Math.round( (0.5+ci/2) * iterations );
	var low = means[loIndex];
	var high = means[hiIndex];
	var plusMinus = (high-low)/2;
	return {
		avg: roundToNearest2Digits(average(means)),
		plusMinus: roundToNearest2Digits(plusMinus),
		low: low,
		high: high
	}
}

function average(data){
	var sum = 0;
	for(var i=0; i<data.length; i++) sum+=data[i];
	return sum/data.length;
}

function resample(data){
	var length = data.length;
	var newSample = [];
	for(var i=0; i<length; i++){
		var randomIndex = Math.floor(Math.random()*length);
		var randomValue = data[randomIndex]
		newSample.push(randomValue);
	}
	return newSample;
}

function roundToNearest2Digits(num){
	return Math.round(num*100)/100;
}