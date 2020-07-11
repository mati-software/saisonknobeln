var matiWebglUtil = {};

matiWebglUtil.createShader = function(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
};

matiWebglUtil.createVertexShader = function(gl, source) {
    return matiWebglUtil.createShader(gl, gl.VERTEX_SHADER, source);
};

matiWebglUtil.createFragmentShader = function(gl, source) {
    return matiWebglUtil.createShader(gl, gl.FRAGMENT_SHADER, source);
};

matiWebglUtil.createProgram = function(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
};

matiWebglUtil.initPositionVertexBufferMitZweiAllesAbdeckendenTriangles = function(gl, program) {
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    //ein buffer fuer 2d-punkte wird erzeugt, aus dem a_position dann befuellt wird
    //der buffer ist auf der grafikkarte hinterlegt
    var positionBuffer = gl.createBuffer();
    //bind positionBuffer to gl.ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 2d punkte fuer 2 dreiecke
    var positions = [
        -1, -1,
        -1, 1,
        1, -1,
        
        1, 1,
        1, -1,
        -1, 1
    ];
    //daten von javascript rueber zur grafikkarte schaffen, STATIC_DRAW gibt an, dass wir die daten nicht oft aendern wollen
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(positionAttributeLocation);
     
    // Beschreiben wie die Daten aus dem Buffer gelesen werden sollen
    var anzahlWerteProVertex = 2; // der befuellt dann damit einen vec2
    var type = gl.FLOAT;          // Koordinaten-Werte sind 32bit floats
    var normalize = false;        // Daten nicht normalisieren
    var stride = 0;               // pro Vertex den position-Pointer immer genau anzahlWerteProVertex * sizeof(type) vorwaerts bewegen
    var offset = 0;               // am Anfang des buffers starten
    gl.vertexAttribPointer(positionAttributeLocation, anzahlWerteProVertex, type, normalize, stride, offset);
};

matiWebglUtil.flattenToArray = function(verticesArray) {
    var neuerArray = [];
    for (let vertex of verticesArray) {
        for (let attributeKey in vertex) {
            let attributeValue = vertex[attributeKey];
            if (typeof attributeValue === 'number') {
                neuerArray.push(attributeValue);
            }
            else if (typeof attributeValue === 'object') { //es handelt sich um einen Vektor
                for (let vektorTeilwert of attributeValue) {
                    neuerArray.push(vektorTeilwert);
                }
            }
        }
    }
    return neuerArray;
};

matiWebglUtil.befuelleAttributeBuffer = function(gl, verticesArray, indeciesArray, attributeBuffer, indexBuffer) {
    var positions = matiWebglUtil.flattenToArray(verticesArray);

    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indeciesArray), gl.STATIC_DRAW);
};
    
    
    
matiWebglUtil.setAttributePointerAndEnableAttributeArray = function(gl, program, verticesArray) {    
    var beispielVertex = verticesArray[0];
    let sizeForEachVertex = 0;
    let offset = 0;
    for (attributeName in beispielVertex) {
        let attributeValue = beispielVertex[attributeName];
        if (typeof attributeValue === 'number') {
            sizeForEachVertex += 1;
        }
        else {
            sizeForEachVertex += attributeValue.length;
        }
    }
    for (attributeName in beispielVertex) {
        let anzahlArrayElemente;
        let attributeValue = beispielVertex[attributeName];
        if (typeof attributeValue === 'number') {
            anzahlArrayElemente = 1;
        }
        else {
            anzahlArrayElemente = attributeValue.length;
        }
        
        let attributeLocation = gl.getAttribLocation(program, attributeName);
        gl.vertexAttribPointer(
            attributeLocation, //Attribut-Nummer
            anzahlArrayElemente,
            gl.FLOAT, //Daten-Typ pro einzelwert
            false, //Normalize
            sizeForEachVertex * Float32Array.BYTES_PER_ELEMENT, //Stride (Byte-Groesse aller Werte fuer diesen Vertex zusammen, 4 Byte pro float)
            offset * Float32Array.BYTES_PER_ELEMENT //Offset in Byte
        );
        gl.enableVertexAttribArray(attributeLocation);
        
        offset += anzahlArrayElemente;
    }
};

matiWebglUtil.disableAttributeArray = function(gl, program, verticesArray) {    
    var beispielVertex = verticesArray[0];
    for (attributeName in beispielVertex) {
        let attributeLocation = gl.getAttribLocation(program, attributeName);
        gl.disableVertexAttribArray(attributeLocation);
    }
};
