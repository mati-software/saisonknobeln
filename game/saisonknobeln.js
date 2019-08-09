var mati = {};

mati.Spieler = class {
    constructor(id) {
		this.id = id;
		
        this.farbe = mati.knobel.spielerFarben.get(id);
		if (this.farbe === undefined) {
			this.farbe = matiFarbutil.getNaechsteFarbe();
			mati.knobel.spielerFarben.set(id, this.farbe);
		}
		
		this.cssFarbe100 = matiFarbutil.toCssString(this.farbe);
		this.cssFarbe50 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .5));
		this.cssFarbe30 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .3));
		this.cssFarbeHell50 = matiFarbutil.toCssString(matiFarbutil.aufgehellteFarbe(this.farbe, .5));
		
		this.verbindungAbgebrochen = false;
		
		this.altePunktzahl = 0;
		this.aktuellePunktzahl = 0;
    }
};





mati.knobel = {
	spracheCode : 'en',
	aktuelleRubrik : null,
	rubriken : [],
	guiTexte : {},
	aktuelleFrageIndizes : {
	},
	fragen : {
	},
	spielerImLaufendenSpiel : [],
	spielerAufWarteliste : [],
	spielerFarben : new Map(),
	befehlsQueue : [],
	befehlsQueueWirdAbgearbeitet : false,
	spielLaeuft : false,
	queueEnthaeltLaufendesSpiel : false
};

mati.knobel.setSpracheCode = function(neuerSpracheCode) {
	//TODO sprache an clients senden
	
	//neue Sprache uebernehmen (in Queue, damit Reihenfolge stimmt falls jemand 2 mal ganz schnell die Sprache umstellt)
	mati.knobel.befehlsQueue.push(function() {
		mati.knobel.spracheCode = neuerSpracheCode;
		mati.knobel.gotoNaechsterBefehl();
	});
	
	//Rubriken laden
	mati.knobel.befehlsQueue.push(function() {
		matiUtil.loadJson(Tiltspot.get.assetUrl("category-list.json"), function(rubriken) {
			mati.knobel.rubriken = rubriken;
			mati.knobel.gotoNaechsterBefehl();
		});
	});
	//Fragen laden
	mati.knobel.befehlsQueue.push(function() {
		let anzahlGeladeneRubriken = 0;
		for (let rubrik of mati.knobel.rubriken) {
			mati.knobel.aktuelleFrageIndizes[rubrik] = -1;
			matiUtil.loadJson(Tiltspot.get.assetUrl("questions/" + rubrik + "_" + mati.knobel.spracheCode + ".json"), function(data) {
				mati.knobel.fragen[rubrik] = data.questions;
				anzahlGeladeneRubriken++;
				if (anzahlGeladeneRubriken === mati.knobel.rubriken.length) {
					mati.knobel.gotoNaechsterBefehl();
				}
			});
		}
	});
	//Gui-Texte laden
	mati.knobel.befehlsQueue.push(function() {
		matiUtil.loadJson(Tiltspot.get.assetUrl("gui-l10n/" + mati.knobel.spracheCode + ".json"), function(guiTexte) {
			mati.knobel.guiTexte = guiTexte;
			mati.knobel.gotoNaechsterBefehl();
		});
	});
	//HTML rendern
	mati.knobel.befehlsQueue.push(function() {
		document.getElementById('mati_spiel_lobby').innerHTML = `
			<h1>Saisonknobeln</h1>
			
			<div id="mati_spiel_joincode_container">${mati.knobel.l10nHtml('Join-Code')}: <span id="mati_spiel_joincode">${matiUtil.htmlEscape(Tiltspot.get.entryCode())}</span></div>
			
			<div id="mati_spiel_spielerliste_container">
				<div id="mati_spiel_spielerliste">
					<div id="mati_spiel_spielerliste_caption">
						${mati.knobel.l10nHtml('Spieler')}
					</div>
					<div id="mati_spiel_spielerliste_content">
					</div>
				</div>
			</div>
			
			<div id="mati_spiel_spielerwarteliste_container">
				<div id="mati_spiel_spielerwarteliste">
					<div id="mati_spiel_spielerwarteliste_caption">
						${mati.knobel.l10nHtml('Warteliste')}
					</div>
					<div id="mati_spiel_spielerwarteliste_content">
					</div>
				</div>
			</div>
		`;

		mati.knobel.spielerChanged();
		
		mati.knobel.gotoNaechsterBefehl();
	});
	
	mati.knobel.starteBefehlsQueueAbarbeitung();
	

	
	
	
	

	

	
};

mati.knobel.starteBefehlsQueueAbarbeitung = function() {
	if (!mati.knobel.befehlsQueueWirdAbgearbeitet) {
		mati.knobel.gotoNaechsterBefehl();
	}
};
mati.knobel.gotoNaechsterBefehl = function() {
	if (mati.knobel.befehlsQueue.length > 0) {
		let befehl = mati.knobel.befehlsQueue.shift();
		mati.knobel.befehlsQueueWirdAbgearbeitet = true;
		befehl();
	}
	else {
		mati.knobel.befehlsQueueWirdAbgearbeitet = false;
	}
};

















mati.knobel.neuesSpielStarten = function() {
	mati.knobel.queueEnthaeltLaufendesSpiel = true;
	
	mati.knobel.befehlsQueue.push(function() {
		mati.knobel.spielLaeuft = true;
		mati.knobel.aktuelleRubrik = null;
		mati.knobel.gotoNaechsterBefehl();
	});
	
	for (let rubrik of mati.knobel.rubriken) {
		mati.knobel.befehlsQueue.push(function() {
			//naechste Rubrik waehlen
			if (mati.knobel.aktuelleRubrik === null) {
				mati.knobel.aktuelleRubrik = mati.knobel.rubriken[0];
			}
			else {
				var alterIndex = mati.knobel.rubriken.indexOf(mati.knobel.aktuelleRubrik);
				var neuerIndex = (alterIndex + 1) % fragen.length;
				mati.knobel.aktuelleRubrik = mati.knobel.rubriken[neuerIndex];
			}
			
			//TODO Zeige Rubrikintro
			
			mati.knobel.gotoNaechsterBefehl();
		});
		
		for (let i=0; i<3; i++) {
			mati.knobel.befehlsQueue.push(function() {
				//naechste Frage waehlen
				mati.knobel.aktuelleFrageIndizes[mati.knobel.aktuelleRubrik] = (mati.knobel.aktuelleFrageIndizes[mati.knobel.aktuelleRubrik] + 1) % mati.knobel.fragen[mati.knobel.aktuelleRubrik].length;
				
				//TODO zeige Frage
				let frage = mati.knobel.fragen[mati.knobel.aktuelleRubrik][mati.knobel.aktuelleFrageIndizes[mati.knobel.aktuelleRubrik]];
				
				mati.knobel.gotoNaechsterBefehl();
			});
			mati.knobel.befehlsQueue.push(function() {
				//TODO zeige Frage-Ergebnis
				
				mati.knobel.gotoNaechsterBefehl();
			});
		}
		
		mati.knobel.befehlsQueue.push(function() {
			//TODO zeige Zwischenstand (bei der Letzten Kategorie Endresultat)
			
			mati.knobel.gotoNaechsterBefehl();
		});
	}
	mati.knobel.befehlsQueue.push(function() {
		//TODO zeige Sieger
		
		mati.knobel.gotoNaechsterBefehl();
	});
	mati.knobel.befehlsQueue.push(function() {
		//TODO zeige Hauptmenue
		
		mati.knobel.spielLaeuft = false;
		mati.knobel.queueEnthaeltLaufendesSpiel = false;
		
		mati.knobel.gotoNaechsterBefehl();
	});
}


















mati.knobel.findeKnobelSpieler = function(id) {
	for (let knobelSpieler of mati.knobel.spielerImLaufendenSpiel) {
		if (knobelSpieler.id === id) {
			return knobelSpieler;
		}
	}
	for (let knobelSpieler of mati.knobel.spielerAufWarteliste) {
		if (knobelSpieler.id === id) {
			return knobelSpieler;
		}
	}
	return null;
};
	
mati.knobel.spielerChanged = function() {
	if (!mati.knobel.spielLaeuft) {
		//Alle Spieler in der Warteschlange mit ins Spiel aufnehmen
		mati.knobel.spielerImLaufendenSpiel = mati.knobel.spielerImLaufendenSpiel.concat(mati.knobel.spielerAufWarteliste);
		mati.knobel.spielerAufWarteliste = [];
	}
	
	//Ueberfluessige Spieler entfernen aus Liste der aktuellen Mitspieler
	for (let i = mati.knobel.spielerImLaufendenSpiel.length - 1; i >= 0; i--) {
		let knobelSpieler = mati.knobel.spielerImLaufendenSpiel[i];
		let user = Tiltspot.get.user(knobelSpieler.id);
		if (user === null || user === undefined || !user.isLoggedIn) {
			if (mati.knobel.spielLaeuft) {
				knobelSpieler.verbindungAbgebrochen = true;
			}
			else {
				mati.knobel.spielerImLaufendenSpiel.splice(i,1);
			}
		}
	}
	
	//Ueberfluessige Spieler aus Warteliste entfernen
	for (let i = mati.knobel.spielerAufWarteliste.length - 1; i >= 0; i--) {
		let knobelSpieler = mati.knobel.spielerAufWarteliste[i];
		let user = Tiltspot.get.user(knobelSpieler.id);
		if (user === null || !user.isLoggedIn) {
			mati.knobel.spielerAufWarteliste.splice(i,1);
		}
	}
	
	//Neue Spieler in Liste aufnehmen
	for (let user of Tiltspot.get.users()) {
		let knobelSpieler = mati.knobel.findeKnobelSpieler(user.controllerId);
		if (knobelSpieler === null) {
			//Knobel-Spieler neu erstellen
			knobelSpieler = new mati.Spieler(user.controllerId);
			Tiltspot.send.msg(user.controllerId, 'setFarbe', knobelSpieler.farbe);
			if (mati.knobel.spielLaeuft) {
				mati.knobel.spielerAufWarteliste.push(knobelSpieler);
			}
			else {
				mati.knobel.spielerImLaufendenSpiel.push(knobelSpieler);
			}
		}
		else {
			knobelSpieler.verbindungAbgebrochen = !user.isLoggedIn;
		}
	}
	
	mati.knobel.renderLobbySpielerListe(document.getElementById('mati_spiel_spielerliste_content'), mati.knobel.spielerImLaufendenSpiel);
	mati.knobel.renderLobbySpielerListe(document.getElementById('mati_spiel_spielerwarteliste_content'), mati.knobel.spielerAufWarteliste);
	
	console.log(Tiltspot.get.users());
	console.log('mati.knobel.spielerImLaufendenSpiel', mati.knobel.spielerImLaufendenSpiel);
	console.log('mati.knobel.spielerAufWarteliste', mati.knobel.spielerAufWarteliste);
};

mati.knobel.renderLobbySpielerListe = function(container, knobelSpielerListe) {
	container.innerHTML = `
		<ul>
			${knobelSpielerListe.map(function (knobelSpieler) {
				let tiltspotUser = Tiltspot.get.user(knobelSpieler.id);
	
				if (tiltspotUser === null || tiltspotUser === undefined) {
					return '<li>Verbindung abgebrochen</li>';
				}
	
				return `
					<li class="mati_spieler">
						<span class="mati_spieler_img" style="background-color:${knobelSpieler.cssFarbeHell50}">
							<img src="${tiltspotUser.profilePicture}" />
						</span>
						<span class="mati_spieler_text" style="color: ${knobelSpieler.cssFarbeHell50}; background: ${knobelSpieler.cssFarbe50} linear-gradient(135deg, ${knobelSpieler.cssFarbe50}, ${knobelSpieler.cssFarbe30});">${matiUtil.htmlEscape(tiltspotUser.nickname)}</span>
					</li>
				`;
			}).join('')}
		</ul>
	`;
	matiUtil.schriftgroesseAnpassenDamitHoehePasst(container, container.querySelector("ul"));
};

mati.knobel.l10n = function(textKey) {
	let text = mati.knobel.guiTexte[textKey];
	if (text) {
		return text;
	}
	return textKey;
};

mati.knobel.l10nHtml = function(textKey) {
	return matiUtil.htmlEscape(mati.knobel.l10n(textKey));
};