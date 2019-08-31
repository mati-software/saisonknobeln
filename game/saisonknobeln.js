var mati = {
	aktuelleRubrik : null,
	rubriken : [],
	spracheCode : 'en',
	spielerImLaufendenSpiel : [],
	spielerAufWarteliste : [],
	spielerFarben : new Map(),
	spielLaeuft : false,
	queueEnthaeltLaufendesSpiel : false,
	aktuellSichbarerContainer : null,
	tatsaechlicheAnzahlStimmenFuerA : null,
	tatsaechlicheAnzahlStimmenFuerB : null
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
		this.antwortAufAktuelleFrage = null;
		this.schaetzungAFuerAktuelleFrage = null;
		this.schaetzungBFuerAktuelleFrage = null;
		
		this.lastMsg = null;
    }
};





mati.setSpracheCode = function(neuerSpracheCode) {
	//neue Sprache uebernehmen (in Queue, damit Reihenfolge stimmt falls jemand 2 mal ganz schnell die Sprache umstellt)
	matiUtil.pushBefehl(function() {
		mati.spracheCode = neuerSpracheCode;
		mati.broadcast();
		matiUtil.gotoNaechsterBefehl();
	});
	
	//Rubriken laden
	matiUtil.pushBefehl(function() {
		matiUtil.loadJson(Tiltspot.get.assetUrl("category-list.json"), function(rubrikKeys) {
			mati.rubriken = rubrikKeys.map(function(rubrikKey) {
				let img = document.createElement("IMG");
				img.src = Tiltspot.get.assetUrl(rubrikKey + '.jpg');
				return {key : rubrikKey, img : img};
			});
			matiUtil.gotoNaechsterBefehl();
		});
	});
	//Fragen laden
	matiUtil.pushBefehl(function() {
		let anzahlGeladeneRubriken = 0;
		for (let rubrik of mati.rubriken) {
			rubrik.aktuellerFrageIndex = -1;
			matiUtil.loadJson(Tiltspot.get.assetUrl("questions/" + rubrik.key + "_" + mati.spracheCode + ".json"), function(data) {
				rubrik.fragen = data.questions.map(function(frage) {
					let frageMitImgObj = {
						"text" : frage.text,
						"answers" : frage.answers
					};
					if (frage.img) {
						let img = document.createElement("IMG");
						img.src = Tiltspot.get.assetUrl('questions/' + frage.img);
						frageMitImgObj.img = img;
					}
					return frageMitImgObj;
				});
				rubrik.name = data.name;
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
		
		document.getElementById('mati_frage_erlaeuterung').innerText = matiUtil.l10n('Wähle eine Antwort! Halte Deine Wahl vor den anderen Spielern geheim!');
		
		document.getElementById('mati_frage_ergebnis_tatsaechlich_label').innerText = matiUtil.l10n('Tatsächliche Aufteilung');
		
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
	
	let daten = {
		spracheCode : mati.spracheCode,
		farbe : spieler.farbe
	};
	
	if (befehl === 'zeigeAntwortmoeglichkeiten') {
		daten.antwortMoeglichkeiten = mati.aktuelleRubrik.fragen[mati.aktuelleRubrik.aktuellerFrageIndex].answers;
		daten.anzahlSpieler = mati.spielerImLaufendenSpiel.length;
	}
	
	Tiltspot.send.msg(spieler.id, befehl, daten);
	spieler.lastMsg = befehl;
};

mati.broadcast = function(befehl) {
	for (let spieler of mati.spielerImLaufendenSpiel) {
		mati.sendMsg(spieler, befehl);
	}
};

mati.zeigeContainer = function(containerElement, rueckwaerts, callback) {
	if (containerElement === mati.aktuellSichbarerContainer) {
		callback();
		return;
	}
	
	containerElement.style['visibility'] = 'visible';
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
			mati.aktuellSichbarerContainer.style['visibility'] = 'hidden';
		}
		
		mati.aktuellSichbarerContainer = containerElement;
		if (containerElement.id !== 'mati_pausemenue') {
			mati.aktuellerContainerLautSpielstatus = containerElement;
		}
		callback();
	}, 1000);
};

mati.setFrageGroesseUndPosition = function() {
	let divText = document.getElementById('mati_frage_text');
	let divTextContainer = document.getElementById('mati_frage_text_container');

	let fontProzent = 200;
	divText.style['font-size'] = fontProzent + '%';
	divText.style['left'] = '0';
	divText.style['top'] = '0';
	let matiFragebox = document.getElementById('mati_frage');
	
	if (divText.clientWidth > divTextContainer.clientWidth) {
		fontProzent = Math.floor(fontProzent * divTextContainer.clientWidth / divText.clientWidth);
		divText.style['font-size'] = fontProzent + '%';
	}
	let maximaleUebrigeAnzahlVerkleinerungsversuche = 10;
	while (divText.clientHeight > divTextContainer.clientHeight
			&& maximaleUebrigeAnzahlVerkleinerungsversuche > 0) {
		fontProzent = Math.floor(fontProzent * .9);
		divText.style['font-size'] = fontProzent + '%';
		maximaleUebrigeAnzahlVerkleinerungsversuche--;
	}
	divText.style['left'] = Math.floor((divTextContainer.clientWidth - divText.clientWidth) / 2) + 'px';
	divText.style['top'] = Math.floor((divTextContainer.clientHeight - divText.clientHeight) / 2) + 'px';
};

mati.neuesSpiel = function() {
	mati.queueEnthaeltLaufendesSpiel = true;
	
	matiUtil.pushBefehl(function() {
		mati.spielLaeuft = true;
		mati.aktuelleRubrik = null;
		mati.broadcast('zeigeWarten');
		
		document.getElementById('mati_frage_spieler').innerHTML = mati.spielerImLaufendenSpiel.map(mati.renderSpieler).join('');
		mati.schrittweiseResizeBisEsPasst(document.getElementById('mati_frage_spieler_container'), document.getElementById('mati_frage_spieler'));
		
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
			
			document.getElementById('mati_rubrik_intro_name').setAttribute('stroke-dasharray', '0 100');
			document.getElementById('mati_rubrik_intro_name').setAttribute('fill', 'none');
			document.getElementById('mati_rubrik_intro_balken1').style['width'] = '0';
			document.getElementById('mati_rubrik_intro_balken2').style['width'] = '0';
			
			document.getElementById('mati_rubrik_intro_name').textContent = mati.aktuelleRubrik.name;
			document.getElementById('mati_rubrik_intro').style['background-image'] = `url(${mati.aktuelleRubrik.img.src})`;
			
			mati.zeigeContainer(document.getElementById('mati_rubrik_intro'), false, matiUtil.gotoNaechsterBefehl);
		});

		matiUtil.pushBefehl(function() {
			let balken1 = document.getElementById('mati_rubrik_intro_balken1');
			let balken2 = document.getElementById('mati_rubrik_intro_balken2');
			
			let rubrikIntroAnimationStartzeit;
			let textElement = document.getElementById('mati_rubrik_intro_name');
			
			
			function rubrikIntroAnimation(timestamp) {
				if (!rubrikIntroAnimationStartzeit) {
					rubrikIntroAnimationStartzeit = timestamp;
				}
				var progress = timestamp - rubrikIntroAnimationStartzeit;
				
				
				if (progress < 1000) {
					balken1.style['width'] = (progress / 20) + '%';
					balken2.style['width'] = (progress / 20) + '%';
					window.requestAnimationFrame(rubrikIntroAnimation);
				}
				else if (progress < 3000) {
					balken1.style['width'] = '100%';
					balken2.style['width'] = '0%';
					let dashLaenge = Math.floor((progress-1000) / 20);
					textElement.setAttribute('stroke-dasharray', dashLaenge+' '+(100-dashLaenge));
					window.requestAnimationFrame(rubrikIntroAnimation);
				}
				else if (progress < 5000) {
					balken1.style['width'] = '100%';
					balken2.style['width'] = '0%';
					textElement.removeAttribute('stroke-dasharray');
					textElement.setAttribute('fill', `rgba(0, 0, 0, ${(progress - 3000)/2000})`);
					window.requestAnimationFrame(rubrikIntroAnimation);
				}
				else {
					balken1.style['width'] = '100%';
					balken2.style['width'] = '0%';
					textElement.removeAttribute('stroke-dasharray');
					textElement.setAttribute('fill', `rgba(0, 0, 0, 1)`);
					matiUtil.gotoNaechsterBefehl();
				}
			}

			window.requestAnimationFrame(rubrikIntroAnimation);
		});
		
		for (let i=0; i<3; i++) {
			matiUtil.pushBefehl(function() {
				//naechste Frage waehlen
				mati.aktuelleRubrik.aktuellerFrageIndex = (mati.aktuelleRubrik.aktuellerFrageIndex + 1) % mati.aktuelleRubrik.fragen.length;
				
				let frage = mati.aktuelleRubrik.fragen[mati.aktuelleRubrik.aktuellerFrageIndex];
				document.getElementById('mati_frage_text').innerText = frage.text;
				document.getElementById('mati_frage').style['background-image'] = `url(${mati.aktuelleRubrik.img.src})`;
				
				document.getElementById('mati_frage_bild').innerHTML = '';
				if (frage.img) {
					let seitenverhaeltnis = frage.img.naturalWidth / frage.img.naturalHeight;
					document.getElementById('mati_frage_bild').appendChild(frage.img);
					frage.img.style['width'] = (8*seitenverhaeltnis)+'em';
					frage.img.style['height'] = 8+'em';
					document.getElementById('mati_frage_text_und_bild').style['grid-template-columns'] = `minmax(50%,1fr) minmax(0,${8*seitenverhaeltnis + 2}em)`;
				}
				else {
					document.getElementById('mati_frage_text_und_bild').style['grid-template-columns'] = `minmax(50%,1fr) minmax(0,0)`;
				}
				
				mati.setFrageGroesseUndPosition();
				
				//FIXME bild ist ggf noch nicht geladen
				
				for (let spieler of mati.spielerImLaufendenSpiel) {
					spieler.antwortAufAktuelleFrage = null;
					spieler.schaetzungAFuerAktuelleFrage = null;
					spieler.schaetzungBFuerAktuelleFrage = null;
				}
				for (let spielerElement of document.getElementById('mati_frage_spieler').getElementsByClassName('mati_spieler')) {
					spielerElement.classList.remove('mati_spieler_fertig');
					spielerElement.classList.add('mati_wackelnd');
				}
				
				mati.zeigeContainer(document.getElementById('mati_frage'), false, function() {
					mati.broadcast('zeigeAntwortmoeglichkeiten');
				});
			});
			matiUtil.pushBefehl(function() {
				mati.tatsaechlicheAnzahlStimmenFuerA = 0;
				mati.tatsaechlicheAnzahlStimmenFuerB = 0;
				for (let spieler of mati.spielerImLaufendenSpiel) {
					if (spieler.antwortAufAktuelleFrage === 0) {
						mati.tatsaechlicheAnzahlStimmenFuerA++;
					}
					if (spieler.antwortAufAktuelleFrage === 1) {
						mati.tatsaechlicheAnzahlStimmenFuerB++;
					}
				}
				
				//TODO zeige Frage-Ergebnis
				document.getElementById('mati_frage_ergebnis').style['background-image'] = `url(${mati.aktuelleRubrik.img.src})`;
				
				//TODO richtigen Wert einfuegen (zumindest wenn er nicht 100% richtig geraten wurde) und beim berechnen vom platzbedarf auch mit beachten
				let sortierteSpieler = mati.spielerImLaufendenSpiel.slice().sort(function(spieler1, spieler2) {
					return spieler2.schaetzungAFuerAktuelleFrage - spieler1.schaetzungAFuerAktuelleFrage;
				});
				document.getElementById('mati_frage_ergebnis_schaetzungen').innerHTML = `
					<div id="mati_frage_ergebnis_antwortmoeglichkeiten">
						<div id="mati_frage_ergebnis_antwortmoeglichkeitA">${matiUtil.htmlEscape(mati.aktuelleRubrik.fragen[mati.aktuelleRubrik.aktuellerFrageIndex].answers[0])}</div>
						<div id="mati_frage_ergebnis_antwortmoeglichkeitB">${matiUtil.htmlEscape(mati.aktuelleRubrik.fragen[mati.aktuelleRubrik.aktuellerFrageIndex].answers[1])}</div>
					</div>
					${sortierteSpieler.map(function(knobelSpieler) {
						return `
							<div class="mati_frage_ergebnis_zeile" id="mati_frage_ergebnis_zeile_id_${knobelSpieler.id}">
								${mati.renderSpieler(knobelSpieler)}
								<div class="mati_frage_ergebnis_balken_container" style="background: ${knobelSpieler.cssFarbe50} linear-gradient(0deg, ${knobelSpieler.cssFarbe50}, ${knobelSpieler.cssFarbe30});">
									<div class="mati_frage_ergebnis_balken" style="background: ${knobelSpieler.cssFarbeHell50} linear-gradient(0deg, ${knobelSpieler.cssFarbe100}, ${knobelSpieler.cssFarbeHell50}); width: ${knobelSpieler.schaetzungAFuerAktuelleFrage / (knobelSpieler.schaetzungAFuerAktuelleFrage + knobelSpieler.schaetzungBFuerAktuelleFrage) * 100}%">
									</div>
									<div class="mati_frage_ergebnis_balken_zahlA">
										${knobelSpieler.schaetzungAFuerAktuelleFrage}
									</div>
									<div class="mati_frage_ergebnis_balken_zahlB">
										${knobelSpieler.schaetzungBFuerAktuelleFrage}
									</div>
								</div>
							</div>
						`;
					}).join('')}
					<div id="mati_frage_ergebnis_platzhalter"></div>
				`;
				
				document.getElementById('mati_frage_ergebnis_tatsaechlich_a').innerText = mati.tatsaechlicheAnzahlStimmenFuerA;
				document.getElementById('mati_frage_ergebnis_tatsaechlich_b').innerText = mati.tatsaechlicheAnzahlStimmenFuerB;
				
				document.getElementById('mati_frage_ergebnis_tatsaechlich').style['width'] = (mati.tatsaechlicheAnzahlStimmenFuerA / (mati.tatsaechlicheAnzahlStimmenFuerA + mati.tatsaechlicheAnzahlStimmenFuerB) * 100) + '%';
				
				document.getElementById('mati_frage_ergebnis_tatsaechlich').classList.remove('mati_eingeblendet');
				
				//bei vielen Spielern skalieren
				matiUtil.schriftgroesseAnpassenDamitHoehePasst(document.getElementById("mati_frage_ergebnis_schaetzungen_container"), document.getElementById("mati_frage_ergebnis_schaetzungen"), true);
				
				mati.zeigeContainer(document.getElementById('mati_frage_ergebnis'), false, matiUtil.gotoNaechsterBefehl);
			});
			for (let i=0; i<mati.spielerImLaufendenSpiel.length; i++) {
				matiUtil.pushBefehl(function() {
					document.getElementById('mati_frage_ergebnis_schaetzungen').getElementsByClassName('mati_frage_ergebnis_zeile')[i].classList.add('mati_eingeblendet');
					setTimeout(matiUtil.gotoNaechsterBefehl, 500);
				});
			}
			
			
			matiUtil.pushBefehl(function() {
				setTimeout(function() {
					document.getElementById('mati_frage_ergebnis_tatsaechlich').classList.add('mati_eingeblendet');
					
					setTimeout(matiUtil.gotoNaechsterBefehl, 1000);
				}, 500);
			});
			matiUtil.pushBefehl(function() {
				let minimalerAbstand = mati.spielerImLaufendenSpiel.length;
				for (let spieler of mati.spielerImLaufendenSpiel) {
					let abstandBeiDiesemSpieler = Math.abs(spieler.schaetzungAFuerAktuelleFrage - mati.tatsaechlicheAnzahlStimmenFuerA);
					if (abstandBeiDiesemSpieler < minimalerAbstand) {
						minimalerAbstand = abstandBeiDiesemSpieler;
					}
				}
				
				let maximalMoeglicherAbstand = Math.max(mati.tatsaechlicheAnzahlStimmenFuerA, mati.tatsaechlicheAnzahlStimmenFuerB);
				
				//Punkte verteilen und die Spieler die am naechsten dran sind markieren
				for (let spieler of mati.spielerImLaufendenSpiel) {
					let abstandBeiDiesemSpieler = Math.abs(spieler.schaetzungAFuerAktuelleFrage - mati.tatsaechlicheAnzahlStimmenFuerA);
					if (abstandBeiDiesemSpieler === minimalerAbstand) {
						spieler.aktuellePunktzahl += mati.spielerImLaufendenSpiel.length;
						if (abstandBeiDiesemSpieler === 0) {
							spieler.aktuellePunktzahl += mati.spielerImLaufendenSpiel.length;
						}
						let spielerZeileElement = document.getElementById('mati_frage_ergebnis_zeile_id_' + spieler.id);
						var gutGeratenElement = document.createElement("div");
						gutGeratenElement.classList.add('mati_frage_ergebnis_zeile_gut_geraten');
						gutGeratenElement.style['background-color'] = spieler.cssFarbe100;
						spielerZeileElement.insertBefore(gutGeratenElement, spielerZeileElement.firstChild);
					}
					spieler.aktuellePunktzahl += maximalMoeglicherAbstand - abstandBeiDiesemSpieler;
				}
				
				
				setTimeout(matiUtil.gotoNaechsterBefehl, 3000);
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
		mati.spielLaeuft = false;
		mati.queueEnthaeltLaufendesSpiel = false;
		
		mati.broadcast('zeigeHauptmenue');
		mati.zeigeContainer(document.getElementById('mati_spiel_lobby'), false, matiUtil.gotoNaechsterBefehl);
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
		<div class="mati_liste">
			${knobelSpielerListe.map(mati.renderSpieler).join('')}
		</div>
	`;
	matiUtil.schriftgroesseAnpassenDamitHoehePasst(container, container.querySelector(".mati_liste"));
};

mati.renderSpieler = function(knobelSpieler) {
	let tiltspotUser = Tiltspot.get.user(knobelSpieler.id);
	
	if (tiltspotUser === null || tiltspotUser === undefined) {
		return '';
	}

	return `
		<div class="mati_spieler mati_spieler_id_${knobelSpieler.id}">
			<span class="mati_spieler_img" style="background-color:${knobelSpieler.cssFarbeHell50}">
				<img src="${tiltspotUser.profilePicture}" />
			</span>
			<span class="mati_spieler_text" style="color: ${knobelSpieler.cssFarbeHell50}; background: ${knobelSpieler.cssFarbe50} linear-gradient(135deg, ${knobelSpieler.cssFarbe50}, ${knobelSpieler.cssFarbe30});">${matiUtil.htmlEscape(tiltspotUser.nickname)}</span>
		</div>
	`;
};

mati.gotoNaechsterBefehlFallsAlleAntwortenAbgegebenWurden = function() {
	for (let spieler of mati.spielerImLaufendenSpiel) {
		if (spieler.antwortAufAktuelleFrage === null) {
			return;
		}
	}
	//Zeit fuer letzte Spieler-Animation lassen
	setTimeout(matiUtil.gotoNaechsterBefehl, 800);
};

mati.schrittweiseResizeBisEsPasst = function(container, inhalt) {
	let fontProzent = 100;
	inhalt.style['font-size'] = fontProzent + '%';
	
	let maximaleUebrigeAnzahlVerkleinerungsversuche = 20;
	while (inhalt.clientHeight > container.clientHeight
			&& maximaleUebrigeAnzahlVerkleinerungsversuche > 0) {
		fontProzent = Math.floor(fontProzent * .9);
		inhalt.style['font-size'] = fontProzent + '%';
		maximaleUebrigeAnzahlVerkleinerungsversuche--;
	}
};