var matiFarbutil = {};

matiFarbutil.naechsteFarbeIndex = 0;

matiFarbutil.farbarrayNachFarbenSortiert = [
	{rot:255, gruen:  0, blau:  0},
	{rot:255, gruen:140, blau:  0},
	{rot:255, gruen:255, blau:  0},
	{rot:  0, gruen:255, blau:  0},
	{rot:  0, gruen:220, blau:255},
	{rot:  0, gruen:  0, blau:255},
	{rot:140, gruen:  0, blau:255},
	{rot:255, gruen:  0, blau:200}
];

matiFarbutil.farbarrayNachIndexSortiert = matiUtil.shuffleArray(matiFarbutil.farbarrayNachFarbenSortiert.slice());

matiFarbutil.getFarbe = function(index) {
	while (index >= matiFarbutil.farbarrayNachIndexSortiert.length) {
		//Neue Farben erzeugen
		for (var i=matiFarbutil.farbarrayNachFarbenSortiert.length-1; i>=0; i--) {
			var neueFarbe;
			if (i===matiFarbutil.farbarrayNachFarbenSortiert.length-1) {
				neueFarbe = matiFarbutil.mischeFarben(matiFarbutil.farbarrayNachFarbenSortiert[i], matiFarbutil.farbarrayNachFarbenSortiert[0]);
			}
			else {
				neueFarbe = matiFarbutil.mischeFarben(matiFarbutil.farbarrayNachFarbenSortiert[i], matiFarbutil.farbarrayNachFarbenSortiert[i+1]);
			}
			//An Position i+1 einfuegen
			matiFarbutil.farbarrayNachFarbenSortiert.splice(i+1, 0, neueFarbe);
		}
		//Neue Farben in anderen Array uebertragen
		var neueElemente = [];
		for (var i=1; i<matiFarbutil.farbarrayNachFarbenSortiert.length; i=i+2) {
			neueElemente.push(matiFarbutil.farbarrayNachFarbenSortiert[i]);
		}
		matiFarbutil.farbarrayNachIndexSortiert = matiFarbutil.farbarrayNachIndexSortiert.concat(matiUtil.shuffleArray(neueElemente));
	}
	return matiFarbutil.farbarrayNachIndexSortiert[index];
};

matiFarbutil.mischeFarben = function(farbe1, farbe2) {
	return {
		rot: Math.floor((farbe1.rot + farbe2.rot) / 2),
		gruen: Math.floor((farbe1.gruen + farbe2.gruen) / 2),
		blau: Math.floor((farbe1.blau + farbe2.blau) / 2)
	};
};
			
matiFarbutil.getNaechsteFarbe = function() {
	var farbe = matiFarbutil.getFarbe(matiFarbutil.naechsteFarbeIndex);
	matiFarbutil.naechsteFarbeIndex++;
	return farbe;
};

matiFarbutil.toCssString = function(farbe) {
	return 'rgb(' + farbe.rot + ',' + farbe.gruen + ',' + farbe.blau + ')';
};

matiFarbutil.gedimmteFarbe = function(farbe, leuchtkraftFaktor) {
	return {
		rot: Math.floor(farbe.rot * leuchtkraftFaktor),
		gruen: Math.floor(farbe.gruen * leuchtkraftFaktor),
		blau: Math.floor(farbe.blau * leuchtkraftFaktor)
	};
};

matiFarbutil.aufgehellteFarbe = function(farbe, aufhellungsFaktor) {
	return {
		rot: farbe.rot + Math.floor((255 - farbe.rot) * aufhellungsFaktor),
		gruen: farbe.gruen + Math.floor((255 - farbe.gruen) * aufhellungsFaktor),
		blau: farbe.blau + Math.floor((255 - farbe.blau) * aufhellungsFaktor)
	};
};
