var matiUtil = {
	befehlsQueue : [],
	befehlsQueueWirdAbgearbeitet : false,
	l10nTexte : {}
};




matiUtil.l10n = function(textKey) {
	let text = matiUtil.l10nTexte[textKey];
	if (text) {
		return text;
	}
	return textKey;
};

matiUtil.l10nHtml = function(textKey) {
	return matiUtil.htmlEscape(matiUtil.l10n(textKey));
};




matiUtil.gotoNaechsterBefehl = function() {
	if (matiUtil.befehlsQueue.length > 0) {
		let befehl = matiUtil.befehlsQueue.shift();
		matiUtil.befehlsQueueWirdAbgearbeitet = true;
		befehl();
	}
	else {
		matiUtil.befehlsQueueWirdAbgearbeitet = false;
	}
};
matiUtil.pushBefehl = function(befehlsFunktion) {
	matiUtil.befehlsQueue.push(befehlsFunktion);
	if (!matiUtil.befehlsQueueWirdAbgearbeitet) {
		matiUtil.gotoNaechsterBefehl();
	}
};







matiUtil.shuffleArray = function(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
};


matiUtil.enterFullscreen = function() {
	var element = document.documentElement; //ganze Seite
	if(element.requestFullscreen) {
		element.requestFullscreen();
	} else if(element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if(element.msRequestFullscreen) {
		element.msRequestFullscreen();
	} else if(element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	}
};				

matiUtil.htmlEscape = function(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/`/g, '&#96;');
};

matiUtil.schriftgroesseAnpassenDamitHoehePasst = function(container, content) {
	content.style["font-size"] = '100%';
	if (container.offsetHeight < content.offsetHeight) {
		var neueSchriftgroesse = Math.floor(container.offsetHeight * 100 / content.offsetHeight);
		if (neueSchriftgroesse < 1) {
			neueSchriftgroesse = 1;
		}
		content.style["font-size"] = neueSchriftgroesse + '%';
	}
};

matiUtil.loadJson = function(dateipfad, callback) {   
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");
	//Funktioniert nicht in Edge: request.responseType('json');
	//Edge kennt json nicht als responseType, daher haendisch JSON.parse
	request.addEventListener("load", function () {
		callback(JSON.parse(request.responseText));
    });
    request.open('GET', dateipfad, true);
    request.send();  
 };