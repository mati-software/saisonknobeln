var mati = {
    aktuellesTheme : null,
	aktuelleSection : null,
    aktuelleFrage : null,
	spracheCode : 'en',
    sprachen : [],
    themes : [],
	spielerImLaufendenSpiel : [],
	spielerAufWarteliste : [],
	spielerFarben : new Map(),
	queueEnthaeltLaufendesSpiel : false,
    aktuellerStatus : 'hauptmenue', //der Status wird immer sofort angepasst, auch bereits vor einer noch auszufuehrenden Animation
	aktuellSichbarerContainer : null,
	tatsaechlicheAnzahlStimmenFuerA : null,
	tatsaechlicheAnzahlStimmenFuerB : null,
	maximalePunktzahl : 0,
	platzwechselVorhanden : false,
    lastDeltaThemeInThemeSelection : 0
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
        
        this.name = Tiltspot.get.user(id).nickname;
    }
};





mati.setSpracheCode = function(neuerSpracheCode) {
	//neue Sprache uebernehmen (in Queue, damit Reihenfolge stimmt falls jemand 2 mal ganz schnell die Sprache umstellt)
	matiUtil.pushBefehl(function() {
		mati.spracheCode = neuerSpracheCode;
		mati.broadcast();
        for (let sprache of mati.sprachen) {
            document.getElementById(`mati_flagge_code_${sprache.code}`).style['display'] = sprache.code === mati.spracheCode ? 'block' : 'none';
        }
		matiUtil.gotoNaechsterBefehl();
	});
	
    //Section-Bilder laden
	matiUtil.pushBefehl(function() {
        for (let theme of mati.themes) {
            if (theme.codeMitPrefix.indexOf(neuerSpracheCode + '_') === 0 && theme.sectionImages === null) {
                theme.sectionImages = {};
                for (let section of theme.content.sections) {
                    let img = document.createElement("IMG");
                    img.src = Tiltspot.get.assetUrl("content/" + theme.codeMitPrefix + "/" + section.img);
                    theme.sectionImages[img.src] = img;
                }
            }
        }
        matiUtil.gotoNaechsterBefehl();
	});
    
	//GUI-Texte uebernehmen
	matiUtil.pushBefehl(function() {
        for (let sprache of mati.sprachen) {
            if (sprache.code === mati.spracheCode) {
                matiUtil.l10nTexte = sprache.texte;
                break;
            }
        }
        
		document.getElementById('mati_spiel_spielerliste_caption').innerText = matiUtil.l10n('Spieler');
		document.getElementById('mati_spiel_spielerwarteliste_caption').innerText = matiUtil.l10n('Warteliste');
		
		document.getElementById('mati_frage_erlaeuterung').innerText = matiUtil.l10n('Wähle eine Antwort! Halte Deine Wahl vor den anderen Spielern geheim!');
		
		document.getElementById('mati_frage_ergebnis_tatsaechlich_label').innerText = matiUtil.l10n('Tatsächliche Aufteilung');
		
		document.getElementById('mati_spiel_lobby_credits').innerText = matiUtil.l10n('Ein Spiel von Timo Scheit und Martin Dostert');
        
        document.getElementById('mati_theme_selection_erlaeuterung').innerText = matiUtil.l10n('Thema wählen');
		
		matiUtil.gotoNaechsterBefehl();
	});
};








mati.sendMsg = function(spieler, befehl) {
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
		farbe : spieler.farbe,
        username : spieler.name,
		sound : matiUtil.musikIstEingeschaltet
	};
	
	if (befehl === 'zeigeAntwortmoeglichkeiten') {
		daten.antwortMoeglichkeiten = mati.aktuelleFrage.answers;
		daten.anzahlSpieler = mati.spielerImLaufendenSpiel.length;
	}
    
    if (befehl === 'zeigeThemeSelection') {
        daten.aktuellesTheme = mati.aktuellesTheme.codeMitPrefix;
        daten.lastDeltaThemeInThemeSelection = mati.lastDeltaThemeInThemeSelection;
        daten.verfuegbareThemes = mati.themes.filter(function(theme) {
            return theme.codeMitPrefix.indexOf(mati.spracheCode + '_') === 0;
        }).map(function(theme) {
            let simplifiedThemeObject = {
                sectionImages : theme.content.sections.map((section) => section.img),
                name : theme.content.name,
                codeMitPrefix : theme.codeMitPrefix
            };
            return simplifiedThemeObject;
        });
    }
	
	Tiltspot.send.msg(spieler.id, befehl, daten);
	spieler.lastMsg = befehl;
};

mati.broadcast = function(befehl) {
	for (let spieler of mati.spielerImLaufendenSpiel) {
		mati.sendMsg(spieler, befehl);
	}
};

mati.zeigeContainer = function(containerElement, callback) {
	if (containerElement === mati.aktuellSichbarerContainer) {
		callback();
		return;
	}
	
	containerElement.style['display'] = 'block';

	if (mati.aktuellSichbarerContainer !== null) {
		containerElement.classList.add('mati_box_show');
	
		mati.aktuellSichbarerContainer.classList.remove('mati_box_show');
		mati.aktuellSichbarerContainer.classList.add('mati_box_hide');
	}
	
	setTimeout(function () {
		if (mati.aktuellSichbarerContainer !== null) {
            if (mati.aktuellSichbarerContainer.id === 'mati_spiel_lobby') {
                //Sicherstellen, dass Animation beendet ist, da DIV ausgeblendet wird
                matiAnimationUtil.finishQueue('matiIntroQueue');
            }
            
			mati.aktuellSichbarerContainer.style['display'] = 'none';
			containerElement.classList.remove('mati_box_hide');
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
	while (divText.clientHeight - 1 > divTextContainer.clientHeight
			&& maximaleUebrigeAnzahlVerkleinerungsversuche > 0) {
		fontProzent = Math.floor(fontProzent * .9);
		divText.style['font-size'] = fontProzent + '%';
		maximaleUebrigeAnzahlVerkleinerungsversuche--;
	}
	divText.style['left'] = Math.floor((divTextContainer.clientWidth - divText.clientWidth) / 2) + 'px';
	divText.style['top'] = Math.floor((divTextContainer.clientHeight - divText.clientHeight) / 2) + 'px';
};

mati.neuesSpiel = function() {
    matiUtil.pushBefehl(function() {
        mati.aktuellerStatus = 'themeauswahl';
        
        let verfuegbareThemes = mati.themes.filter(function(theme) {
            return theme.codeMitPrefix.indexOf(mati.spracheCode + '_') === 0;
        });
        
        if (verfuegbareThemes.length === 0) {
            //TODO
        }
        
        mati.aktuellesTheme = verfuegbareThemes[0];
        
        if (verfuegbareThemes.length === 1) {
            mati.pushThemeStarten();
            matiUtil.gotoNaechsterBefehl();
        }
        else {
            document.getElementById('mati_theme_selection_items').innerHTML = `
                ${verfuegbareThemes.map(function(theme) {
                    return `
                        <div style="display:none" class="mati_themeselection_item_container" id="mati_themeselection_item_container_${theme.codeMitPrefix}">
                            <div class="mati_themeselection_item">
                                <div class="mati_themeselection_item_imagecontainer">
                                    ${theme.content.sections.map(function(section) {
                                        //FIXME alles was aus json kommt muss sicherheitshalber ordentlich gefiltert werden
                                        return `
                                            <div style="background-image:url(${Tiltspot.get.assetUrl('content/' + theme.codeMitPrefix + '/' + section.img)})">
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div class="mati_themeselection_item_text">
                                    ${matiUtil.htmlEscape(theme.content.name)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
            
            document.getElementById('mati_themeselection_item_container_' + mati.aktuellesTheme.codeMitPrefix).style['display'] = 'flex';
            
            mati.broadcast('zeigeThemeSelection');
            mati.zeigeContainer(document.getElementById('mati_theme_selection'), matiUtil.gotoNaechsterBefehl);
        }
    });
};

mati.pushThemeStarten = function() {
    if (mati.queueEnthaeltLaufendesSpiel) {
        return;
    }
    
	mati.queueEnthaeltLaufendesSpiel = true;
	
	matiUtil.pushBefehl(function() {
		mati.aktuellerStatus = 'spiel';
		mati.aktuelleSection = null;
		
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
		document.getElementById('mati_frage').style['display'] = 'block';
		mati.schrittweiseResizeBisEsPasst(document.getElementById('mati_frage_spieler_container'), document.getElementById('mati_frage_spieler'));
		document.getElementById('mati_frage').style['display'] = 'none';
        
        //Alle Fragen-Bilder vorladen
        mati.aktuellesTheme.questionImages = {};
        for (let section of mati.aktuellesTheme.content.sections) {
            for (let question of section.questions) {
                if (question.img) {
                    //zunaechst nur Map mit null-Werten aufbauen, damit DOM-Objekte bei gleichen Bildern nicht unnoetig mehrfach erstellt werden
                    mati.aktuellesTheme.questionImages[question.img] = null;
                }
            }
        }
        for (let imgName in mati.aktuellesTheme.questionImages) {
            let img = document.createElement("IMG");
            img.src = Tiltspot.get.assetUrl("content/" + mati.aktuellesTheme.codeMitPrefix + "/" + imgName);
            mati.aktuellesTheme.questionImages[imgName] = img;
        }
		
		matiUtil.gotoNaechsterBefehl();
	});
	
	for (let section of mati.aktuellesTheme.content.sections) {
		matiUtil.pushBefehl(function() {
			//naechste Section waehlen
			if (mati.aktuelleSection === null) {
				mati.aktuelleSection = mati.aktuellesTheme.content.sections[0];
			}
			else {
				var alterIndex = mati.aktuellesTheme.content.sections.indexOf(mati.aktuelleSection);
				var neuerIndex = (alterIndex + 1) % mati.aktuellesTheme.content.sections.length;
				mati.aktuelleSection = mati.aktuellesTheme.content.sections[neuerIndex];
			}
			
			document.getElementById('mati_section_intro_name').setAttribute('stroke-dasharray', '0 100');
			document.getElementById('mati_section_intro_name').setAttribute('fill', 'none');
			document.getElementById('mati_section_intro_balken1').style['width'] = '0';
			document.getElementById('mati_section_intro_balken2').style['width'] = '0';
			
			document.getElementById('mati_section_intro_name').textContent = mati.aktuelleSection.name;
			document.getElementById('mati_section_intro').style['background-image'] = `url(${Tiltspot.get.assetUrl("content/" + mati.aktuellesTheme.codeMitPrefix + "/" + mati.aktuelleSection.img)})`;
			
			mati.zeigeContainer(document.getElementById('mati_section_intro'), matiUtil.gotoNaechsterBefehl);
			matiUtil.fadeOut(document.getElementById("mati_hauptmusik"), 1000);
		});

		matiUtil.pushBefehl(function() {
			matiUtil.play(document.getElementById("mati_sectionintro_musik"));

			let balken1 = document.getElementById('mati_section_intro_balken1');
			let balken2 = document.getElementById('mati_section_intro_balken2');
			
			let sectionIntroAnimationStartzeit;
			let textElement = document.getElementById('mati_section_intro_name');
			
			
			function sectionIntroAnimation(timestamp) {
				if (!sectionIntroAnimationStartzeit) {
					sectionIntroAnimationStartzeit = timestamp;
				}
				var progress = timestamp - sectionIntroAnimationStartzeit;
				
				
				if (progress < 1000) {
					balken1.style['width'] = (progress / 20) + '%';
					balken2.style['width'] = (progress / 20) + '%';
					window.requestAnimationFrame(sectionIntroAnimation);
				}
				else if (progress < 3000) {
					balken1.style['width'] = '100%';
					balken2.style['width'] = '0%';
					let dashLaenge = Math.floor((progress-1000) / 20);
					textElement.setAttribute('stroke-dasharray', dashLaenge+' '+(100-dashLaenge));
					window.requestAnimationFrame(sectionIntroAnimation);
				}
				else if (progress < 5000) {
					balken1.style['width'] = '100%';
					balken2.style['width'] = '0%';
					textElement.removeAttribute('stroke-dasharray');
					textElement.setAttribute('fill', `rgba(0, 0, 0, ${(progress - 3000)/2000})`);
					window.requestAnimationFrame(sectionIntroAnimation);
				}
				else {
					balken1.style['width'] = '100%';
					balken2.style['width'] = '0%';
					textElement.removeAttribute('stroke-dasharray');
					textElement.setAttribute('fill', `rgba(0, 0, 0, 1)`);
					
					matiUtil.fadeIn(document.getElementById("mati_hauptmusik"), 2000);
					
					matiUtil.gotoNaechsterBefehl();
				}
			}

			window.requestAnimationFrame(sectionIntroAnimation);
		});
		
		for (let i=0; i<3; i++) {
			matiUtil.pushBefehl(function() {
				//naechste Frage waehlen
                while (mati.aktuellesTheme.shuffledQuestionOrderForSections.length < mati.aktuellesTheme.content.sections.length) {
                    mati.aktuellesTheme.shuffledQuestionOrderForSections.push({
                        shuffledArray : [],
                        aktuellerArrayIndex : 0
                    });
                }
                let aktuelleSectionIndex = mati.aktuellesTheme.content.sections.indexOf(mati.aktuelleSection);
                let shuffledOrderForSection = mati.aktuellesTheme.shuffledQuestionOrderForSections[aktuelleSectionIndex];
                if (shuffledOrderForSection.shuffledArray.length !== mati.aktuelleSection.questions.length) {
                    if (shuffledOrderForSection.shuffledArray.length > mati.aktuelleSection.questions.length) {
                        shuffledOrderForSection.shuffledArray = [];
                    }
                    while (shuffledOrderForSection.shuffledArray.length < mati.aktuelleSection.questions.length) {
                        shuffledOrderForSection.shuffledArray.push(shuffledOrderForSection.shuffledArray.length);
                    }
                    matiUtil.shuffleArray(shuffledOrderForSection.shuffledArray);
                    shuffledOrderForSection.aktuellerArrayIndex = 0;
                }

				shuffledOrderForSection.aktuellerArrayIndex = (shuffledOrderForSection.aktuellerArrayIndex + 1) % shuffledOrderForSection.shuffledArray.length;
				
                mati.aktuelleFrage = mati.aktuelleSection.questions[shuffledOrderForSection.shuffledArray[shuffledOrderForSection.aktuellerArrayIndex]];
				document.getElementById('mati_frage_text').innerText = mati.aktuelleFrage.text;
				document.getElementById('mati_frage').style['background-image'] = `url(${Tiltspot.get.assetUrl("content/" + mati.aktuellesTheme.codeMitPrefix + "/" + mati.aktuelleSection.img)})`;
				
				document.getElementById('mati_frage_bild').innerHTML = '';
				if (mati.aktuelleFrage.img) {
                    let imgObject = mati.aktuellesTheme.questionImages[mati.aktuelleFrage.img];
                    
					let seitenverhaeltnis = imgObject.naturalWidth / imgObject.naturalHeight;
					document.getElementById('mati_frage_bild').appendChild(imgObject);
					imgObject.style['width'] = (8*seitenverhaeltnis)+'em';
					imgObject.style['height'] = 8+'em';
					document.getElementById('mati_frage_text_und_bild').style['grid-template-columns'] = `minmax(50%,1fr) minmax(0,${8*seitenverhaeltnis + 2}em)`;
				}
				else {
					document.getElementById('mati_frage_text_und_bild').style['grid-template-columns'] = `minmax(50%,1fr) minmax(0,0)`;
				}
				
				document.getElementById('mati_frage').style['display'] = 'block';
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
				
				mati.zeigeContainer(document.getElementById('mati_frage'), function() {
					matiUtil.gotoNaechsterBefehl();
				});
			});
            matiUtil.pushBefehl(function() {
                mati.broadcast('zeigeAntwortmoeglichkeiten');
                return true; //unterbrechbar, da auf Userinteraktion gewartet wird
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
				
                document.getElementById('mati_frage_ergebnis').style['background-image'] = `url(${Tiltspot.get.assetUrl("content/" + mati.aktuellesTheme.codeMitPrefix + "/" + mati.aktuelleSection.img)})`;
				
				let sortierteSpieler = mati.spielerImLaufendenSpiel.slice().sort(function(spieler1, spieler2) {
					return spieler2.schaetzungAFuerAktuelleFrage - spieler1.schaetzungAFuerAktuelleFrage;
				});
				document.getElementById('mati_frage_ergebnis_schaetzungen').innerHTML = `
					<div id="mati_frage_ergebnis_antwortmoeglichkeiten">
						<div id="mati_frage_ergebnis_antwortmoeglichkeitA">${matiUtil.htmlEscape(mati.aktuelleFrage.answers[0])}</div>
						<div id="mati_frage_ergebnis_antwortmoeglichkeitB">${matiUtil.htmlEscape(mati.aktuelleFrage.answers[1])}</div>
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
				document.getElementById('mati_frage_ergebnis').style['display'] = 'block';
				matiUtil.schriftgroesseAnpassenDamitHoehePasst(document.getElementById("mati_frage_ergebnis_schaetzungen_container"), document.getElementById("mati_frage_ergebnis_schaetzungen"), true);
				
				mati.zeigeContainer(document.getElementById('mati_frage_ergebnis'), matiUtil.gotoNaechsterBefehl);
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
			
			document.getElementById('mati_punktestand_ueberschrift').innerText = matiUtil.l10n(mati.aktuelleSection === mati.aktuellesTheme.content.sections[mati.aktuellesTheme.content.sections.length - 1] ? 'Endresultat' : 'Zwischenstand');
			
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
            document.getElementById('mati_punktestand').style['background-image'] = `url(${Tiltspot.get.assetUrl("content/" + mati.aktuellesTheme.codeMitPrefix + "/" + mati.aktuelleSection.img)})`;
			
			//bei vielen Spielern skalieren
			document.getElementById('mati_punktestand').style['display'] = 'block';
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
			mati.zeigeContainer(document.getElementById('mati_punktestand'), matiUtil.gotoNaechsterBefehl);
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
		if (section === mati.aktuellesTheme.content.sections[mati.aktuellesTheme.content.sections.length - 1]) {
			matiUtil.pushBefehl(function() {
				document.getElementById('mati_punktestand_spielerliste_container_container').classList.add('mati_punktestand_endresultat');
				mati.broadcast('zeigeSpielAbschliessen');
                return true; //unterbrechbar, da auf userinteraktion gewartet wird
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
		mati.aktuellerStatus = 'hauptmenue';
		mati.queueEnthaeltLaufendesSpiel = false;
		
		mati.broadcast('zeigeHauptmenue');
		mati.zeigeContainer(document.getElementById('mati_spiel_lobby'), matiUtil.gotoNaechsterBefehl);
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

mati.getSpielerImLaufendenSpielById = function(id) {
	for (let knobelSpieler of mati.spielerImLaufendenSpiel) {
		if (knobelSpieler.id === id) {
			return knobelSpieler;
		}
	}
};
	
mati.spielerChanged = function() {
	if (mati.aktuellerStatus !== 'spiel') {
		//Alle Spieler in der Warteschlange mit ins Spiel aufnehmen
		mati.spielerImLaufendenSpiel = mati.spielerImLaufendenSpiel.concat(mati.spielerAufWarteliste);
		mati.spielerAufWarteliste = [];
	}
	
	//Ueberfluessige Spieler entfernen aus Liste der aktuellen Mitspieler
	for (let i = mati.spielerImLaufendenSpiel.length - 1; i >= 0; i--) {
		let knobelSpieler = mati.spielerImLaufendenSpiel[i];
		let user = Tiltspot.get.user(knobelSpieler.id);
		if (user === null || user === undefined || !user.isLoggedIn) {
			if (mati.aktuellerStatus === 'spiel') {
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
	
	let oldMatiLobbyDisplay = document.getElementById('mati_spiel_lobby').style['display'];
	document.getElementById('mati_spiel_lobby').style['display'] = 'block';
	mati.renderLobbySpielerListe(document.getElementById('mati_spiel_spielerliste_content'), mati.spielerImLaufendenSpiel);
	mati.renderLobbySpielerListe(document.getElementById('mati_spiel_spielerwarteliste_content'), mati.spielerAufWarteliste);
	document.getElementById('mati_spiel_lobby').style['display'] = oldMatiLobbyDisplay;
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
			<span class="mati_spieler_text" style="color: ${knobelSpieler.cssFarbeHell50}; background: ${knobelSpieler.cssFarbe50} linear-gradient(135deg, ${knobelSpieler.cssFarbe50}, ${knobelSpieler.cssFarbe30});">${matiUtil.htmlEscape(knobelSpieler.name)}</span>
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
	while (inhalt.clientHeight - 1 > container.clientHeight
			&& maximaleUebrigeAnzahlVerkleinerungsversuche > 0) {
		fontProzent = Math.floor(fontProzent * .9);
		inhalt.style['font-size'] = fontProzent + '%';
		maximaleUebrigeAnzahlVerkleinerungsversuche--;
	}
};

mati.getIndexAktuelleSprache = function() {
    let indexAktuelleSprache = 0;
    for (let sprache of mati.sprachen) {
        if (sprache.code === mati.spracheCode) {
            break;
        }
        indexAktuelleSprache++;
    }
    return indexAktuelleSprache;
};

mati.wechseleTheme = function(deltaTheme) {
    if (mati.aktuellerStatus === 'themeauswahl') {
        let verfuegbareThemes = mati.themes.filter(function(theme) {
            return theme.codeMitPrefix.indexOf(mati.spracheCode + '_') === 0;
        });
        
        let aktuellerIndex = verfuegbareThemes.indexOf(mati.aktuellesTheme);
        let neuerIndex = (aktuellerIndex + deltaTheme + verfuegbareThemes.length) % verfuegbareThemes.length;
        let altesTheme = mati.aktuellesTheme;
        mati.aktuellesTheme = verfuegbareThemes[neuerIndex];
        
        let altesThemeDomObject = document.getElementById('mati_themeselection_item_container_' + altesTheme.codeMitPrefix);
        let neuesThemeDomObject = document.getElementById('mati_themeselection_item_container_' + mati.aktuellesTheme.codeMitPrefix);
        
        neuesThemeDomObject.style['display'] = 'flex';
        
        //ggf. noch laufende Animationen beenden
        Velocity(neuesThemeDomObject, 'stop');
        Velocity(altesThemeDomObject, 'stop');
        
        Velocity(neuesThemeDomObject, {
            opacity: [1, 0],
            left: ['0em', (30 * deltaTheme) + 'em'],
        }, {
            easing: 'linear',
            duration: 500
        });
        Velocity(altesThemeDomObject, {
            opacity: [0, 1],
            left: [(-30 * deltaTheme) + 'em', '0em'],
        }, {
            easing: 'linear',
            duration: 500,
            complete: () => {
                altesThemeDomObject.style['display'] = 'none';
            }
        });
        mati.lastDeltaThemeInThemeSelection = deltaTheme;

        mati.broadcast('zeigeThemeSelection');
    }
};

mati.changeUsername = function(id, neuerName) {
    mati.getSpielerImLaufendenSpielById(id).name = neuerName;
    for (let nameDomElement of document.querySelectorAll('.mati_spieler_id_' + id + ' .mati_spieler_text')) {
        nameDomElement.innerText = neuerName;
    }
};