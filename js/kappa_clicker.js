var points;
var pts = 0;
var unlocks; // 0 for not unlocked, 1 for unlocked
var unlocksElements;
var saveData = {};
var clickVal = 1;
var kps = 0;
var kps_mult = 1;

var click = function() {
	pts += clickVal;
	update();
	if (pts >= 10 && unlocks[0] === 0) {
		unlocks[0] = 1;
		unlock();
	}
	if (pts >= 100 && unlocks[1] === 0) {
		unlocks[1] = 1;
		unlock();
	}
};

var unlock = function() {
	// Update unlocks
	
	for (var i = 0; i < unlocks.length; i++) {
		if (unlocks[i] === 1) {
			unlocksElements[i].style.display = "block";

			switch(i){
				case 0:
					unlocksElements[i].onclick = function () {
						if (pts >= 10) {
							pts -= 10;
								clickVal++;
							update();
						}
					};
					break;
				case 1:
					console.log("Test");
                    unlocksElements[i].onclick = function () {
                        if (pts >= 100) {
                            pts -= 100;
                            kps++;
                            update();
                        }
                    };
                    break;
			}
			
		}
	}
};

var update = function() {
    points.innerHTML = pts;
};

var save = function() {
	console.log("Saving...");
	saveData["pts"] = pts;
	saveData["kps"] = kps;
	saveData["clickVal"] = clickVal;
	for (var i=0; i<unlocks.length; i++) {
		saveData["u" + i] = unlocks[i];
	}
	var jsonString = JSON.stringify(saveData);
	document.body.innerHTML += '<div>Save data: ' + btoa(jsonString) + ' </div>';
	console.log("Saved");
};

var load = function() {
	console.log("Loading...");
	var textEl = document.getElementById("load-text");
	var text = atob(textEl.value);

	var loadedData = JSON.parse(text);

	pts = loadedData["pts"];
	kps = loadedData["kps"];
	clickVal = loadedData["clickVal"];
	for (var i=0; i<unlocks.length; i++) {
		unlocks[i] = loadedData["u" + i];
	}
	update();
	unlock();

	console.log("Loaded")
};

$(document).ready(function() {
	console.log("Ready!");
	
	var kappa = document.getElementById("kp-click");
	var saveButton = document.getElementById("save-button");
	var loadButton = document.getElementById("load-button");
	points = document.getElementById("point-text");
	unlocks = [0, 0, 0, 0, 0];
	unlocksElements = document.getElementsByClassName("unlock-button");
	
	kappa.addEventListener("click", click);
	saveButton.addEventListener("click", save);
	loadButton.addEventListener("click", load);
	setInterval(function() {
		pts += (kps * kps_mult);
		update();
	}, 1000);
});
