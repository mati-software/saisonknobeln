var matiUtil = {
	befehlsQueue : [],
	befehlsQueueWirdAbgearbeitet : false,
	l10nTexte : {},
	musikIstEingeschaltet : true,
    aktuellerBefehlIstUnterbrechbar : false,
    esWirdGeradeEinBefehlAusgefuehrt : false,
    callGotoNaechsterBefehlSobaldVorherigerBefehlBeendet : false
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
        if (matiUtil.esWirdGeradeEinBefehlAusgefuehrt) {
            //die Function des alten Befehls soll erst komplett zuende laufen, bevor der neue gestartet wird
            matiUtil.callGotoNaechsterBefehlSobaldVorherigerBefehlBeendet = true;
            return;
        }
		let befehl = matiUtil.befehlsQueue.shift();
		matiUtil.befehlsQueueWirdAbgearbeitet = true;
        matiUtil.esWirdGeradeEinBefehlAusgefuehrt = true;
		matiUtil.aktuellerBefehlIstUnterbrechbar = befehl();
        matiUtil.esWirdGeradeEinBefehlAusgefuehrt = false;
        if (matiUtil.callGotoNaechsterBefehlSobaldVorherigerBefehlBeendet) {
            matiUtil.callGotoNaechsterBefehlSobaldVorherigerBefehlBeendet = false;
            matiUtil.gotoNaechsterBefehl();
        }
	}
	else {
		matiUtil.befehlsQueueWirdAbgearbeitet = false;
	}
};
/**
 * Wenn die befehlsFunktion true zurueck gibt, ist der Befehl unterbrechbar (also keine Animation, sondern irgendwas das auf Nutzereingaben wartet)
 */
matiUtil.pushBefehl = function(befehlsFunktion) {
	matiUtil.befehlsQueue.push(befehlsFunktion);
	if (!matiUtil.befehlsQueueWirdAbgearbeitet) {
		matiUtil.gotoNaechsterBefehl();
	}
};

matiUtil.befehlsqueueLeeren = function() {
    matiUtil.befehlsQueue = [];
    if (matiUtil.aktuellerBefehlIstUnterbrechbar) {
        matiUtil.befehlsQueueWirdAbgearbeitet = false;
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

matiUtil.schriftgroesseAnpassenDamitHoehePasst = function(container, content, isResizeParent) {
	let resizeElement = isResizeParent ? container : content;
	
	resizeElement.style["font-size"] = '100%';
	if (container.offsetHeight < content.offsetHeight) {
		var neueSchriftgroesse = Math.floor(container.offsetHeight * 100 / content.offsetHeight);
		if (neueSchriftgroesse < 1) {
			neueSchriftgroesse = 1;
		}
		resizeElement.style["font-size"] = neueSchriftgroesse + '%';
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


matiUtil.fadeOut = function(audioelement, millisekunden) {
	if (matiUtil.musikIstEingeschaltet) {
		let fadeoutStartzeit = Date.now();

		var fadeAudio = setInterval(function () {
			let neueLautstaerke = 1 - Math.min((Date.now() - fadeoutStartzeit) / millisekunden, 1);

			audioelement.volume = neueLautstaerke;

			if (neueLautstaerke === 0) {
				audioelement.pause();
				clearInterval(fadeAudio);
			}
		}, 200);
	}
};

matiUtil.fadeIn = function(audioelement, millisekunden) {
	if (matiUtil.musikIstEingeschaltet) {
		let fadeoutStartzeit = Date.now();
		
		audioelement.volume = 0;
		audioelement.play();

		var fadeAudio = setInterval(function () {
			let neueLautstaerke = Math.min((Date.now() - fadeoutStartzeit) / millisekunden, 1);

			audioelement.volume = neueLautstaerke;

			if (neueLautstaerke === 1) {
				clearInterval(fadeAudio);
			}
		}, 200);
	}
};

matiUtil.play = function(audioelement) {
	if (matiUtil.musikIstEingeschaltet) {
		audioelement.currentTime = 0;
		audioelement.volume = 1;
		audioelement.play();
	}
};

matiUtil.musikEinschalten = function(audioelement) {
	matiUtil.musikIstEingeschaltet = true;
	audioelement.volume = 1;
	audioelement.play();
};

matiUtil.musikAusschalten = function(audioelement) {
	matiUtil.musikIstEingeschaltet = false;
	audioelement.pause();
};