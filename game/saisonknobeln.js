var mati = {
	aktuelleRubrik : null,
	rubriken : [],
	spracheCode : 'en',
	aktuelleFrageIndizes : {
	},
	fragen : {
	},
	spielerImLaufendenSpiel : [],
	spielerAufWarteliste : [],
	spielerFarben : new Map(),
	spielLaeuft : false,
	queueEnthaeltLaufendesSpiel : false,
	aktuellSichbarerContainer : null
};

mati.Spieler = class {
    constructor(id) {
		this.id = id;
		
        this.farbe = mati.spielerFarben.get(id);
		if (this.farbe === undefined) {
			this.farbe = matiFarbutil.getNaechsteFarbe();
			mati.spielerFarben.set(id, this.farbe);
		}
		
		this.cssFarbe100 = matiFarbutil.toCssString(this.farbe);
		this.cssFarbe50 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .5));
		this.cssFarbe30 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .3));
		this.cssFarbeHell50 = matiFarbutil.toCssString(matiFarbutil.aufgehellteFarbe(this.farbe, .5));
		
		this.verbindungAbgebrochen = false;
		
		this.altePunktzahl = 0;
		this.aktuellePunktzahl = 0;
		
		this.lastMsg = null;
    }
};





mati.setSpracheCode = function(neuerSpracheCode) {
	//TODO sprache an clients senden
	
	//neue Sprache uebernehmen (in Queue, damit Reihenfolge stimmt falls jemand 2 mal ganz schnell die Sprache umstellt)
	matiUtil.pushBefehl(function() {
		mati.spracheCode = neuerSpracheCode;
		mati.broadcast();
		matiUtil.gotoNaechsterBefehl();
	});
	
	//Rubriken laden
	matiUtil.pushBefehl(function() {
		matiUtil.loadJson(Tiltspot.get.assetUrl("category-list.json"), function(rubriken) {
			mati.rubriken = rubriken;
			matiUtil.gotoNaechsterBefehl();
		});
	});
	//Fragen laden
	matiUtil.pushBefehl(function() {
		let anzahlGeladeneRubriken = 0;
		for (let rubrik of mati.rubriken) {
			mati.aktuelleFrageIndizes[rubrik] = -1;
			matiUtil.loadJson(Tiltspot.get.assetUrl("questions/" + rubrik + "_" + mati.spracheCode + ".json"), function(data) {
				mati.fragen[rubrik] = data.questions;
				anzahlGeladeneRubriken++;
				if (anzahlGeladeneRubriken === mati.rubriken.length) {
					matiUtil.gotoNaechsterBefehl();
				}
			});
		}
	});
	//Gui-Texte laden
	matiUtil.pushBefehl(function() {
		matiUtil.loadJson(Tiltspot.get.assetUrl("gui-l10n/" + mati.spracheCode + ".json"), function(guiTexte) {
			matiUtil.l10nTexte = guiTexte;
			matiUtil.gotoNaechsterBefehl();
		});
	});
	//HTML rendern
	matiUtil.pushBefehl(function() {
		document.getElementById('mati_spiel_lobby').innerHTML = `
			<h1>Saisonknobeln</h1>
			
			<div id="mati_spiel_joincode_container">${matiUtil.l10nHtml('Join-Code')}: <span id="mati_spiel_joincode">${matiUtil.htmlEscape(Tiltspot.get.entryCode())}</span></div>
			
			<div id="mati_spiel_spielerliste_container">
				<div id="mati_spiel_spielerliste">
					<div id="mati_spiel_spielerliste_caption">
						${matiUtil.l10nHtml('Spieler')}
					</div>
					<div id="mati_spiel_spielerliste_content">
					</div>
				</div>
			</div>
			
			<div id="mati_spiel_spielerwarteliste_container">
				<div id="mati_spiel_spielerwarteliste">
					<div id="mati_spiel_spielerwarteliste_caption">
						${matiUtil.l10nHtml('Warteliste')}
					</div>
					<div id="mati_spiel_spielerwarteliste_content">
					</div>
				</div>
			</div>
		`;

		mati.spielerChanged();
		
		matiUtil.gotoNaechsterBefehl();
	});
	

	
};








mati.sendMsg = function(spieler, befehl) {
	console.log('typeof spieler', typeof spieler);
	if (typeof spieler !== 'object') {
		spieler = mati.findeKnobelSpieler(spieler);
	}
	
	if (!spieler) {
		return;
	}
	
	if (!befehl) {
		befehl = spieler.lastMsg;
	}
	console.log('spieler.farbe', spieler.farbe);
	Tiltspot.send.msg(spieler.id, befehl, {
		spracheCode : mati.spracheCode,
		farbe : spieler.farbe
	});
	spieler.lastMsg = befehl;
};

mati.broadcast = function(befehl) {
	for (let spieler of mati.spielerImLaufendenSpiel) {
		mati.sendMsg(spieler, befehl);
	}
};



mati.zeigeHauptmenue = function() {
	//TODO mach spielerliste sichtbar
	
	matiUtil.pushBefehl(function() {
		mati.broadcast('zeigeHauptmenue');
		mati.zeigeContainer(document.getElementById('mati_spiel_lobby'), false, matiUtil.gotoNaechsterBefehl);
	});
};


mati.zeigeContainer = function(containerElement, rueckwaerts, callback) {
	if (containerElement === mati.aktuellSichbarerContainer) {
		callback();
		return;
	}
	
	containerElement.style['display'] = 'block';
	containerElement.classList.remove('mati_box_hide');
	containerElement.classList.remove('mati_box_hide_back');
	containerElement.classList.add(rueckwaerts ? 'mati_box_show_back' : 'mati_box_show');
	
	if (mati.aktuellSichbarerContainer !== null) {
		mati.aktuellSichbarerContainer.classList.remove('mati_box_show');
		mati.aktuellSichbarerContainer.classList.remove('mati_box_show_back');
		mati.aktuellSichbarerContainer.classList.add(rueckwaerts ? 'mati_box_hide_back' : 'mati_box_hide');
	}
	
	setTimeout(function () {
		if (mati.aktuellSichbarerContainer !== null) {
			mati.aktuellSichbarerContainer.style['display'] = 'none';
		}
		
		mati.aktuellSichbarerContainer = containerElement;
		if (containerElement.id !== 'mati_pausemenue') {
			mati.aktuellerContainerLautSpielstatus = containerElement;
		}
		callback();
	}, 1000);
};



mati.neuesSpiel = function() {
	mati.queueEnthaeltLaufendesSpiel = true;
	
	matiUtil.pushBefehl(function() {
		mati.spielLaeuft = true;
		mati.aktuelleRubrik = null;
		mati.broadcast('zeigeWarten');
		matiUtil.gotoNaechsterBefehl();
	});
	
	for (let rubrik of mati.rubriken) {
		matiUtil.pushBefehl(function() {
			//naechste Rubrik waehlen
			if (mati.aktuelleRubrik === null) {
				mati.aktuelleRubrik = mati.rubriken[0];
			}
			else {
				var alterIndex = mati.rubriken.indexOf(mati.aktuelleRubrik);
				var neuerIndex = (alterIndex + 1) % mati.rubriken.length;
				mati.aktuelleRubrik = mati.rubriken[neuerIndex];
			}
			
			//TODO Zeige Rubrikintro
			
			matiUtil.gotoNaechsterBefehl();
		});
		
		for (let i=0; i<3; i++) {
			matiUtil.pushBefehl(function() {
				//naechste Frage waehlen
				mati.aktuelleFrageIndizes[mati.aktuelleRubrik] = (mati.aktuelleFrageIndizes[mati.aktuelleRubrik] + 1) % mati.fragen[mati.aktuelleRubrik].length;
				
				//TODO zeige Frage
				let frage = mati.fragen[mati.aktuelleRubrik][mati.aktuelleFrageIndizes[mati.aktuelleRubrik]];
				
				matiUtil.gotoNaechsterBefehl();
			});
			matiUtil.pushBefehl(function() {
				//TODO zeige Frage-Ergebnis
				
				matiUtil.gotoNaechsterBefehl();
			});
		}
		
		matiUtil.pushBefehl(function() {
			//TODO zeige Zwischenstand (bei der Letzten Kategorie Endresultat)
			
			matiUtil.gotoNaechsterBefehl();
		});
	}
	matiUtil.pushBefehl(function() {
		//TODO zeige Sieger
		
		matiUtil.gotoNaechsterBefehl();
	});
	matiUtil.pushBefehl(function() {
		//TODO zeige Hauptmenue
		
		mati.spielLaeuft = false;
		mati.queueEnthaeltLaufendesSpiel = false;
		
		matiUtil.gotoNaechsterBefehl();
	});
};


















mati.findeKnobelSpieler = function(id) {
	for (let knobelSpieler of mati.spielerImLaufendenSpiel) {
		if (knobelSpieler.id === id) {
			return knobelSpieler;
		}
	}
	for (let knobelSpieler of mati.spielerAufWarteliste) {
		if (knobelSpieler.id === id) {
			return knobelSpieler;
		}
	}
	return null;
};
	
mati.spielerChanged = function() {
	if (!mati.spielLaeuft) {
		//Alle Spieler in der Warteschlange mit ins Spiel aufnehmen
		mati.spielerImLaufendenSpiel = mati.spielerImLaufendenSpiel.concat(mati.spielerAufWarteliste);
		mati.spielerAufWarteliste = [];
	}
	
	//Ueberfluessige Spieler entfernen aus Liste der aktuellen Mitspieler
	for (let i = mati.spielerImLaufendenSpiel.length - 1; i >= 0; i--) {
		let knobelSpieler = mati.spielerImLaufendenSpiel[i];
		let user = Tiltspot.get.user(knobelSpieler.id);
		if (user === null || user === undefined || !user.isLoggedIn) {
			if (mati.spielLaeuft) {
				knobelSpieler.verbindungAbgebrochen = true;
			}
			else {
				mati.spielerImLaufendenSpiel.splice(i,1);
			}
		}
	}
	
	//Ueberfluessige Spieler aus Warteliste entfernen
	for (let i = mati.spielerAufWarteliste.length - 1; i >= 0; i--) {
		let knobelSpieler = mati.spielerAufWarteliste[i];
		let user = Tiltspot.get.user(knobelSpieler.id);
		if (user === null || !user.isLoggedIn) {
			mati.spielerAufWarteliste.splice(i,1);
		}
	}
	
	//Neue Spieler in Liste aufnehmen
	for (let user of Tiltspot.get.users()) {
		let knobelSpieler = mati.findeKnobelSpieler(user.controllerId);
		if (knobelSpieler === null) {
			//Knobel-Spieler neu erstellen
			knobelSpieler = new mati.Spieler(user.controllerId);
			if (mati.spielLaeuft) {
				mati.spielerAufWarteliste.push(knobelSpieler);
			}
			else {
				mati.spielerImLaufendenSpiel.push(knobelSpieler);
			}
		}
		else {
			knobelSpieler.verbindungAbgebrochen = !user.isLoggedIn;
		}
	}
	
	mati.renderLobbySpielerListe(document.getElementById('mati_spiel_spielerliste_content'), mati.spielerImLaufendenSpiel);
	mati.renderLobbySpielerListe(document.getElementById('mati_spiel_spielerwarteliste_content'), mati.spielerAufWarteliste);
	
	console.log(Tiltspot.get.users());
	console.log('mati.spielerImLaufendenSpiel', mati.spielerImLaufendenSpiel);
	console.log('mati.spielerAufWarteliste', mati.spielerAufWarteliste);
};

mati.renderLobbySpielerListe = function(container, knobelSpielerListe) {
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

