var matiUtil = {};

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