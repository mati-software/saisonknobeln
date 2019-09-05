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
	tatsaechlicheAnzahlStimmenFuerB : null,
	maximalePunktzahl : 0,
	platzwechselVorhanden : false
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
		
		for (let spieler of mati.spielerImLaufendenSpiel) {
			spieler.altePunktzahl = 0;
			spieler.aktuellePunktzahl = 0;
			spieler.antwortAufAktuelleFrage = null;
			spieler.schaetzungAFuerAktuelleFrage = null;
			spieler.schaetzungBFuerAktuelleFrage = null;
			spieler.lastMsg = null;
		}
		
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
				
				document.getElementById('mati_frage_ergebnis').style['background-image'] = `url(${mati.aktuelleRubrik.img.src})`;
				
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
					let neuePunkte = 0;
					let spielerZeileElement = document.getElementById('mati_frage_ergebnis_zeile_id_' + spieler.id);
					let abstandBeiDiesemSpieler = Math.abs(spieler.schaetzungAFuerAktuelleFrage - mati.tatsaechlicheAnzahlStimmenFuerA);
					if (abstandBeiDiesemSpieler === minimalerAbstand) {
						neuePunkte += mati.spielerImLaufendenSpiel.length;
						if (abstandBeiDiesemSpieler === 0) {
							neuePunkte += mati.spielerImLaufendenSpiel.length;
						}
						
						//Blinken wenn nah dran
						let gutGeratenElement = document.createElement("div");
						gutGeratenElement.classList.add('mati_frage_ergebnis_zeile_gut_geraten');
						gutGeratenElement.style['background-color'] = spieler.cssFarbe100;
						spielerZeileElement.insertBefore(gutGeratenElement, spielerZeileElement.firstChild);
					}
					neuePunkte += maximalMoeglicherAbstand - abstandBeiDiesemSpieler;
					
					spieler.aktuellePunktzahl += neuePunkte;
					
					//Neue Punkte in Markierung anzeigen
					let neuePunkteMarkierung = document.createElement("div");
					neuePunkteMarkierung.classList.add('mati_neue_punkte_markierung');
					neuePunkteMarkierung.innerHTML = `
						<svg viewbox="0 0 300 100">
							<path d="M5 50 Q50 5 100 5 L250 5 Q295 5 295 50 Q295 95 250 95 L100 95 Q50 95 5 50 z" stroke-linejoin="round" fill="black" stroke="white" stroke-width="5" />
							<text font-size="75px" x="175" y="75" fill="white" text-anchor="middle">+${neuePunkte}</text>
						</svg>
					`;
					spielerZeileElement.appendChild(neuePunkteMarkierung);
					
				}
				
				setTimeout(matiUtil.gotoNaechsterBefehl, 6000);
			});
		}
		
		//Punktestand anzeigen
		matiUtil.pushBefehl(function() {
			mati.maximalePunktzahl = 0;
			for (let spieler of mati.spielerImLaufendenSpiel) {
				if (spieler.aktuellePunktzahl > mati.maximalePunktzahl) {
					mati.maximalePunktzahl = spieler.aktuellePunktzahl;
				}
			}
			let alteSortierungSpieler = mati.spielerImLaufendenSpiel.slice().sort(function(spieler1, spieler2) {
				return spieler2.altePunktzahl - spieler1.altePunktzahl;
			});
			//FIXME: ich will nicht, dass der bei Punktgleichstand nach der Spielernummer sortiert... stattdessen sollte die alte Reihenfolge beibehalten werden
			//       idee: im spieler-objekt die position speichern und die "alte" position mit als zweitrangiges sortierkriterium aufnehmen
			//       alternative: die spieler im spiel tatsaechlich umsortieren (haette auswirkung auf status bei frage-anzeige usw.)
			//       alternative: ne 2. liste im mati-objekt, dann muesste ich auch seltener clonen
			let sortierteSpieler = mati.spielerImLaufendenSpiel.slice().sort(function(spieler1, spieler2) {
				return spieler2.aktuellePunktzahl - spieler1.aktuellePunktzahl;
			});
			
			document.getElementById('mati_punktestand_spielerliste_container_container').classList.remove('mati_punktestand_endresultat');
			
			document.getElementById('mati_punktestand_ueberschrift').innerText = matiUtil.l10n(mati.aktuelleRubrik === mati.rubriken[mati.rubriken.length - 1] ? 'Endresultat' : 'Zwischenstand');
			
			document.getElementById('mati_punktestand_spielerliste').innerHTML = sortierteSpieler.map(function(knobelSpieler) {
				return `
					<div class="mati_punktestand_zeile" id="mati_punktestand_zeile_id_${knobelSpieler.id}">
						${mati.renderSpieler(knobelSpieler)}
						<div class="mati_punktestand_balken_container" style="background: ${knobelSpieler.cssFarbe50} linear-gradient(0deg, ${knobelSpieler.cssFarbe50}, ${knobelSpieler.cssFarbe30});">
							<div class="mati_punktestand_balken" style="background: ${knobelSpieler.cssFarbeHell50} linear-gradient(0deg, ${knobelSpieler.cssFarbe100}, ${knobelSpieler.cssFarbeHell50}); width: ${knobelSpieler.altePunktzahl / mati.maximalePunktzahl * 100}%">
							</div>
							<div class="mati_punktestand_balken_zahl">
								<span class="mati_punktestand_balken_zahl_wert">${knobelSpieler.altePunktzahl}</span> ${matiUtil.l10nHtml('Punkte')}
							</div>
						</div>
					</div>
				`;
			}).join('');
			document.getElementById('mati_punktestand').style['background-image'] = `url(${mati.aktuelleRubrik.img.src})`;
			
			//bei vielen Spielern skalieren
			matiUtil.schriftgroesseAnpassenDamitHoehePasst(document.getElementById("mati_punktestand_spielerliste_container"), document.getElementById("mati_punktestand_spielerliste"));
			
			//Spieler zunachst an alte Position umpositionieren
			let domZeilenElemente = document.getElementById('mati_punktestand_spielerliste').getElementsByClassName('mati_punktestand_zeile');
			mati.platzwechselVorhanden = false;
			for (let neuePosition=0; neuePosition<sortierteSpieler.length; neuePosition++) {
				let spieler = sortierteSpieler[neuePosition];
				let altePosition = alteSortierungSpieler.indexOf(spieler);
				if (altePosition !== neuePosition) {
					mati.platzwechselVorhanden = true;
				}
				let topNeu = domZeilenElemente[neuePosition].offsetTop;
				let topAlt = domZeilenElemente[altePosition].offsetTop;
				domZeilenElemente[neuePosition].style['transform'] = `translateY(${topAlt - topNeu}px)`;
			}
			mati.zeigeContainer(document.getElementById('mati_punktestand'), false, matiUtil.gotoNaechsterBefehl);
		});
		matiUtil.pushBefehl(function() {
			//Umsortierungsanimaton vorbereiten
			for (let domZeilenElement of document.getElementById('mati_punktestand_spielerliste').getElementsByClassName('mati_punktestand_zeile')) {
				domZeilenElement.style['transition'] = 'transform 1s';
			}
			
			//Punktzahl und Balken animieren
			let punkteAnimationStartzeit;
			function punkteAnimation(timestamp) {
				if (!punkteAnimationStartzeit) {
					punkteAnimationStartzeit = timestamp;
				}
				var progress = timestamp - punkteAnimationStartzeit;
				
				for (let spieler of mati.spielerImLaufendenSpiel) {
					let darzustellendePunktzahl;
					if (progress < 3000) {
						darzustellendePunktzahl = spieler.altePunktzahl + ((spieler.aktuellePunktzahl - spieler.altePunktzahl) * progress / 3000);
					}
					else {
						spieler.altePunktzahl = spieler.aktuellePunktzahl;
						darzustellendePunktzahl = spieler.aktuellePunktzahl;
					}
					
					let spielerZeileDomElement = document.getElementById('mati_punktestand_zeile_id_' + spieler.id);
					spielerZeileDomElement.getElementsByClassName('mati_punktestand_balken')[0].style['width'] = darzustellendePunktzahl / mati.maximalePunktzahl * 100 + '%';
					spielerZeileDomElement.getElementsByClassName('mati_punktestand_balken_zahl_wert')[0].innerText = Math.floor(darzustellendePunktzahl);
				}
				
				if (progress < 3000) {
					window.requestAnimationFrame(punkteAnimation);
				}
				else {
					matiUtil.gotoNaechsterBefehl();
				}
			}

			window.requestAnimationFrame(punkteAnimation);			
		});
		
		matiUtil.pushBefehl(function() {
			if (mati.platzwechselVorhanden) {
				//umsortieren
				for (let domZeilenElement of document.getElementById('mati_punktestand_spielerliste').getElementsByClassName('mati_punktestand_zeile')) {
					domZeilenElement.style['transform'] = 'translateY(0px)';
				}
			
				setTimeout(matiUtil.gotoNaechsterBefehl, 1000);
			}
			else {
				matiUtil.gotoNaechsterBefehl();
			}
		});
		if (rubrik === mati.rubriken[mati.rubriken.length - 1]) {
			matiUtil.pushBefehl(function() {
				document.getElementById('mati_punktestand_spielerliste_container_container').classList.add('mati_punktestand_endresultat');
				//TODO smartphne-weiterutton zeigen
				mati.broadcast('zeigeSpielAbschliessen');
				//matiUtil.gotoNaechsterBefehl();
			});
		}
		else {
			//ist nur Zwischenstand, nach kurzer Wartezeit geht es daher automatisch weiter
			matiUtil.pushBefehl(function() {
				setTimeout(matiUtil.gotoNaechsterBefehl, 4000);
			});
		}
	}
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