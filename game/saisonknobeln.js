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
		this.cssFarbe75 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .75));
		this.cssFarbe50 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .5));
		this.cssFarbe25 = matiFarbutil.toCssString(matiFarbutil.gedimmteFarbe(this.farbe, .25));

		this.cssFarbeHell75 = matiFarbutil.toCssString(matiFarbutil.aufgehellteFarbe(this.farbe, .75));
		this.cssFarbeHell50 = matiFarbutil.toCssString(matiFarbutil.aufgehellteFarbe(this.farbe, .5));
		
		this.verbindungAbgebrochen = false;
		
		this.altePunktzahl = 0;
		this.aktuellePunktzahl = 0;
    }
};





mati.knobel = {
	spielablaufPos : -1,
	aktuelleRubrik : null,
	rubriken : ['herbst', 'winter', 'fruehling', 'sommer'],
	aktuelleFrageIndizes : {
		'herbst' : -1,
		'winter' : -1,
		'fruehling' : -1,
		'sommer' : -1
	},
	fragen : {
		'herbst' : [],
		'winter' : [],
		'fruehling' : [],
		'sommer' : []
	},
	spielerImLaufendenSpiel : [],
	spielerAufWarteliste : [],
	spielerFarben : new Map()
};

mati.knobel.ladeFragen = function() {
	//TODO auslagern und von dateisystem laden
	
	mati.knobel.fragen['herbst'].push({
		'text' : 'Weißwein oder Rotwein?',
		'antwortMoeglichkeiten' : ['Weißwein', 'Rotwein']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'An Halloween kostümieren oder nicht kostümieren?',
		'antwortMoeglichkeiten' : ['kostümieren', 'nicht kostümieren']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'Äpfel lieber süß oder sauer?',
		'antwortMoeglichkeiten' : ['süß', 'sauer']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'Walnüsse oder Haselnüsse?',
		'antwortMoeglichkeiten' : ['Walnüsse', 'Haselnüsse']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'Gehören Pilze auf eine gute Pizza?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'Am 11.11. Karneval oder Sankt Martin?',
		'antwortMoeglichkeiten' : ['Karneval', 'Sankt Martin']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'Sind Windräder eine gute Sache?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['herbst'].push({
		'text' : 'Welche Filmreihe ist besser: "Halloween" oder "Freitag der 13."?',
		'antwortMoeglichkeiten' : ['Halloween', 'Freitag der 13.']
	});
	
	mati.knobel.fragen['winter'].push({
		'text' : 'Zu Weihnachten lieber bunte Lichterketten oder einfarbige Lichterketten?',
		'antwortMoeglichkeiten' : ['bunt', 'einfarbig']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Ist Glüwein genießbar?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Welche Wintersportart ist cooler, Eishockey oder Skispringen?',
		'antwortMoeglichkeiten' : ['Eishockey', 'Skispringen']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Ski oder Snowboard?',
		'antwortMoeglichkeiten' : ['Ski', 'Snowboard']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Soll es im Winter schneien?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Kirchenbesuch an Weihnachten?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'An Silvester selbst Knaller und Raketen abfeuern?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Gewürzspekulatius oder Butterspekulatius?',
		'antwortMoeglichkeiten' : ['Gewürzspekulatius', 'Butterspekulatius']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Wer bringt die Weihnachtsgeschenke?',
		'antwortMoeglichkeiten' : ['Christkind', 'Weihnachtsmann']
	});
	mati.knobel.fragen['winter'].push({
		'text' : 'Handschuhe bei kaltem Wetter?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Tulpen oder Rosen?',
		'antwortMoeglichkeiten' : ['Tulpen', 'Rosen']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Ist die Zeitumstellung auf Sommerzeit eine gute Sache?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Kräuter aus dem eigenen Kräuter-Garten?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Fasten in der Fastenzeit?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Zum Karneval kostümieren oder nicht kostümieren?',
		'antwortMoeglichkeiten' : ['kostümieren', 'nicht kostümieren']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Welche Liebeskomödie ist besser, "Harry und Sally" oder "Tatsächlich Liebe"?',
		'antwortMoeglichkeiten' : ['Harry und Sally', 'Tatsächlich Liebe']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : 'Kirchenbesuch an Ostern?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['fruehling'].push({
		'text' : '"Berlinale" oder "Filmfestspiele von Cannes"?',
		'antwortMoeglichkeiten' : ['Berlinale', 'Filmfestspiele von Cannes']
	});

	mati.knobel.fragen['sommer'].push({
		'text' : 'Schokoeis oder Vanilleeis?',
		'antwortMoeglichkeiten' : ['Schokoeis', 'Vanilleeis']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Badebekleidung für Frauen: Badeanzug oder Bikini?',
		'antwortMoeglichkeiten' : ['Badeanzug', 'Bikini']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Schwimmbad oder Badesee?',
		'antwortMoeglichkeiten' : ['Schwimmbad', 'Badesee']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Strandurlaub oder Urlaub in den Bergen?',
		'antwortMoeglichkeiten' : ['Strandurlaub', 'Urlaub in den Bergen']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Als Mann bei heißem Wetter oberkörperfrei draußen rum rennen?',
		'antwortMoeglichkeiten' : ['Ja', 'Nein']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Olympische Sommerspiele oder Fußball-WM?',
		'antwortMoeglichkeiten' : ['Olympische Sommerspiele', 'Fußball-WM']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Lieber Tageshöchsttemperatur von 25°C oder von 35°C?',
		'antwortMoeglichkeiten' : ['25°C', '35°C']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Im Schwimmbad die meiste Zeit im Wasser verbringen oder die meiste Zeit in der Sonne liegen?',
		'antwortMoeglichkeiten' : ['Zeit im Wasser verbringen', 'In der Sonne liegen']
	});
	mati.knobel.fragen['sommer'].push({
		'text' : 'Zitronenlimonade oder Orangenlimonade?',
		'antwortMoeglichkeiten' : ['Zitronenlimonade', 'Orangenlimonade']
	});
	
};

mati.knobel.gotoNaechsterBefehl = function() {
	spielablaufPos = (spielablaufPos + 1) % mati.knobel.spielablauf.size;
};

mati.knobel.spielInit = function() {
	mati.knobel.aktuelleRubrik = null;
	mati.knobel.gotoNaechsterBefehl();
};

mati.knobel.waehleNaechsteRubrik = function() {
	if (aktuelleRubrik === null) {
		aktuelleRubrik = rubriken[0];
	}
	else {
		var alterIndex = rubriken.indexOf(aktuelleRubrik);
		var neuerIndex = (alterIndex + 1) % fragen.length;
		aktuelleRubrik = rubriken[neuerIndex];
	}
	mati.knobel.gotoNaechsterBefehl();
};

mati.knobel.zeigeRubrikIntro = function() {
	//TODO
	mati.knobel.gotoNaechsterBefehl();
};

mati.knobel.waehleNaechsteFrage = function() {
	mati.knobel.aktuelleFrageIndizes[mati.knobel.aktuelleRubrik]++;
	mati.knobel.gotoNaechsterBefehl();
};

mati.knobel.zeigeFrage = function() {
	var frage = mati.knobel.fragen[mati.knobel.aktuelleRubrik][mati.knobel.aktuelleFrageIndizes[mati.knobel.aktuelleRubrik]];

};

mati.knobel.spielablauf = [
	mati.knobel.spielInit,
	
	//Herbst
	mati.knobel.waehleNaechsteRubrik,
	mati.knobel.zeigeRubrikIntro,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.zeigeZwischenstand,
	
	//Winter
	mati.knobel.waehleNaechsteRubrik,
	mati.knobel.zeigeRubrikIntro,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.zeigeZwischenstand,
	
	//Fruehling
	mati.knobel.waehleNaechsteRubrik,
	mati.knobel.zeigeRubrikIntro,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.zeigeZwischenstand,
	
	//Sommer
	mati.knobel.waehleNaechsteRubrik,
	mati.knobel.zeigeRubrikIntro,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.waehleNaechsteFrage,
	mati.knobel.zeigeFrage,
	mati.knobel.zeigeFrageErgebnis,
	
	mati.knobel.zeigeEndresult,
	mati.knobel.zeigeHauptmenue];
	
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
	let spielLaeuft = mati.knobel.spielAblaufPos >= 0;
	if (!spielLaeuft) {
		//Alle Spieler in der Warteschlange mit ins Spiel aufnehmen
		mati.knobel.spielerImLaufendenSpiel = mati.knobel.spielerImLaufendenSpiel.concat(mati.knobel.spielerAufWarteliste);
		mati.knobel.spielerAufWarteliste = [];
	}
	
	//Ueberfluessige Spieler entfernen aus Liste der aktuellen Mitspieler
	for (let i = mati.knobel.spielerImLaufendenSpiel.length - 1; i >= 0; i--) {
		let knobelSpieler = mati.knobel.spielerImLaufendenSpiel[i];
		let user = Tiltspot.get.user(knobelSpieler.id);
		if (user === null || user === undefined || !user.isLoggedIn) {
			if (spielLaeuft) {
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
			if (spielLaeuft) {
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
					<li>
						<span class="mati_spieler_img" style="background-color:${knobelSpieler.cssFarbeHell50}">
							<img src="${tiltspotUser.profilePicture}" />
						</span>
						<span class="mati_spieler_text" style="color:${knobelSpieler.cssFarbeHell50}">${matiUtil.htmlEscape(tiltspotUser.nickname)}</span>
					</li>
				`;
			}).join('')}
		</ul>
	`;
	matiUtil.schriftgroesseAnpassenDamitHoehePasst(container, container.querySelector("ul"));
};
