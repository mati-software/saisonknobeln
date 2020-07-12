mati.glProgramObjects = {
    borderedBox : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relativ;
            attribute vec2 a_size_in_em;

            varying vec2 v_zweitfarbe_intensitaet_vector;
            varying float v_top_in_em;
            varying float v_left_in_em;
            varying float v_right_in_em;
            varying float v_bottom_in_em;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition, 1.0 + rotatedPosition.z);
                
                v_zweitfarbe_intensitaet_vector = normalize(a_position_in_em_relativ - a_size_in_em * .5);
                v_top_in_em = a_position_in_em_relativ.y;
                v_left_in_em = a_position_in_em_relativ.x;
                v_bottom_in_em = a_size_in_em.y - a_position_in_em_relativ.y;
                v_right_in_em = a_size_in_em.x - a_position_in_em_relativ.x;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_zweitfarbe_intensitaet_vector;
            varying float v_top_in_em;
            varying float v_left_in_em;
            varying float v_right_in_em;
            varying float v_bottom_in_em;
            
            uniform vec3 u_farbe;
            uniform vec3 u_zweitfarbe;
            
            float calculateSchattenvalue(float abstand_in_em) {
                float schattenvalue = 1.0 - min(abstand_in_em, 1.0);
                return 1.0 - schattenvalue * schattenvalue * 0.5;
            }
          
            void main() {
                float zweitfarbeIntensitaet = length(v_zweitfarbe_intensitaet_vector);
                
                float schattenvalue_bottom = calculateSchattenvalue(v_bottom_in_em);
                float schattenvalue_top = calculateSchattenvalue(v_top_in_em);
                float schattenvalue_left = calculateSchattenvalue(v_left_in_em);
                float schattenvalue_right = calculateSchattenvalue(v_right_in_em);
                
                
                gl_FragColor = vec4(mix(u_farbe, u_zweitfarbe, zweitfarbeIntensitaet) * schattenvalue_bottom * schattenvalue_top * schattenvalue_left * schattenvalue_right, 1.0); 
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_farbe', 'u_zweitfarbe'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform3f(this.u_farbe, mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b);
            mati.gl.uniform3f(this.u_zweitfarbe, mati.farbeDunkel30.r, mati.farbeDunkel30.g, mati.farbeDunkel30.b);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'borderedBox') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x + .5, koordinaten.y + .5],
                        a_position_in_em_relativ : [0, 0],
                        a_size_in_em : [koordinaten.width - 1, koordinaten.height - 1]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - .5, koordinaten.y + .5],
                        a_position_in_em_relativ : [koordinaten.width - 1, 0],
                        a_size_in_em : [koordinaten.width - 1, koordinaten.height - 1]
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x + .5, koordinaten.y + koordinaten.height - .5],
                        a_position_in_em_relativ : [0, koordinaten.height - 1],
                        a_size_in_em : [koordinaten.width - 1, koordinaten.height - 1]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - .5, koordinaten.y + koordinaten.height - .5],
                        a_position_in_em_relativ : [koordinaten.width - 1, koordinaten.height - 1],
                        a_size_in_em : [koordinaten.width - 1, koordinaten.height - 1]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },

    schatten : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_shadow_vector;
            attribute float a_shadow_offset;
            attribute float a_shrink_faktor;

            varying vec2 v_shadow_vector;
            varying float v_shadow_offset;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform float u_shrink_x_in_em;

            void main() {
                vec2 positionInEmAbsolutMitShrink = vec2(a_position_in_em_absolute.x - u_shrink_x_in_em * a_shrink_faktor, a_position_in_em_absolute.y);
                
                vec2 normalisierte2dKoordinaten = positionInEmAbsolutMitShrink / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition, 1.0 + rotatedPosition.z);
                
                v_shadow_vector = a_shadow_vector;
                v_shadow_offset = a_shadow_offset;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_shadow_vector;
            varying float v_shadow_offset;
          
            void main() {
                float schattenValue = length(v_shadow_vector);
                schattenValue = (schattenValue - v_shadow_offset) / (1.0 - v_shadow_offset);
                schattenValue = clamp(schattenValue, 0.0, 1.0);
                schattenValue = 1.0 - schattenValue;
                schattenValue = schattenValue * 2.0;
                schattenValue = schattenValue * schattenValue;
                schattenValue = schattenValue / 2.0;
                schattenValue = clamp(schattenValue, 0.0, 1.0);
                
                gl_FragColor = vec4(0.0, 0.0, 0.0, schattenValue); 
            }
        `,
    
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_shrink_x_in_em'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform1f(this.u_shrink_x_in_em, mati.calculateSpielerTextLaengenReduktion());
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'schaetzungBalken') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let shadow = 1;
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y - shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + shadow, koordinaten.y - shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y - shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y - shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [1, -1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [0, -1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [0, -1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [1, -1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    }
                );
                let indexArrayOhneOffset = [0, 4, 1,    1, 4, 5,
                                            1, 5, 2,    2, 5, 6,
                                            2, 6, 3,    3, 6, 7];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
            else if (elementObject.typ === 'spieler') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let namensblockX1 = koordinaten.x + 2;
                let namensblockX2 = koordinaten.x + 2 + 17.6;
                let namensblockY1 = koordinaten.y + 0.8;
                let namensblockY2 = koordinaten.y + koordinaten.height - 0.8;
                
                let shadow = 0.4;
                
                let indexOffset = verticesArray.length;
                
                //TODO unnoetige elemente, die eh vom img verdeckt sind, nicht rendern (linke kante)
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [namensblockX1, namensblockY1 - shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 - shadow, namensblockY1 - shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 + shadow, namensblockY1 - shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    
                    {
                        a_position_in_em_absolute : [namensblockX1, namensblockY1 + shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 - shadow, namensblockY1 + shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 + shadow, namensblockY1 + shadow],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    
                    {
                        a_position_in_em_absolute : [namensblockX1, namensblockY2 - shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 - shadow, namensblockY2 - shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 + shadow, namensblockY2 - shadow],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    
                    {
                        a_position_in_em_absolute : [namensblockX1, namensblockY2 + shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 - shadow, namensblockY2 + shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2 + shadow, namensblockY2 + shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 1
                    },
                    
                    //Schatten an der Grenze zum Hauptbereich
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height - .4],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height - .4],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_shadow_vector : [0, .5],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_shadow_vector : [0, .5],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    }
                );
                let indexArrayOhneOffset = [0, 3, 1,    1, 3, 4,
                                            1, 4, 2,    2, 4, 5,
                                            6, 9, 7,    7, 9, 10,
                                            7, 10, 8,   8, 10, 11,
                                            4, 7, 5,    5, 7, 8,
                                            
                                            12, 14, 13, 13, 14, 15];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
            else if (elementObject.typ === 'pauseMenueSchatten') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                let shadow = 0.4;
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y - shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + shadow, koordinaten.y - shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y - shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    //Spezialfall
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + shadow],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + shadow, koordinaten.y + shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y + shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + shadow],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + koordinaten.height - shadow],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + shadow, koordinaten.y + koordinaten.height - shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y + koordinaten.height - shadow],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + koordinaten.height - shadow],
                        a_shadow_vector : [1, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [0, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + koordinaten.height + shadow],
                        a_shadow_vector : [1, 1],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - shadow, koordinaten.y],
                        a_shadow_vector : [0, 0],
                        a_shadow_offset : 0,
                        a_shrink_faktor : 0
                    }

                );
                let indexArrayOhneOffset = [0, 4, 1,    1, 4, 5,
                                            1, 5, 2,    2, 5, 6,
                                            16, 6, 3,   3, 6, 7,
                                            8, 12, 9,   9, 12, 13,
                                            9, 13, 10,  10, 13, 14,
                                            10, 14, 11, 11, 14, 15,
                                            4, 8, 5,    5, 8, 9,
                                            6, 10, 7,   7, 10, 11];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    spielerName : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relative;
            attribute vec3 a_farbe1;
            attribute vec3 a_farbe2;

            varying vec2 v_position_in_em_relative;
            varying vec3 v_farbe1;
            varying vec3 v_farbe2;

            uniform vec2 u_screenSizeInEm;
            uniform float u_laengenReduktion;

            void main() {
                vec2 positionInEmAbsolutMitReduktion = a_position_in_em_absolute;
                if (a_position_in_em_relative.x > 0.0) {
                    positionInEmAbsolutMitReduktion.x = positionInEmAbsolutMitReduktion.x - u_laengenReduktion;
                    v_position_in_em_relative = a_position_in_em_relative - u_laengenReduktion;
                }
                else {
                    v_position_in_em_relative = a_position_in_em_relative;
                }
                
                vec2 normalisierte2dKoordinaten = positionInEmAbsolutMitReduktion / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                gl_Position = vec4(normalisierte2dKoordinaten, 0.0, 1.0);
                
                v_farbe1 = a_farbe1;
                v_farbe2 = a_farbe2;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_position_in_em_relative;
            varying vec3 v_farbe1;
            varying vec3 v_farbe2;

            uniform float u_laengenReduktion;
            
            void main() {
                // linear-gradient(135deg, rgb(127,0,0), rgb(76,0,0));
                gl_FragColor = vec4(mix(v_farbe1, v_farbe2, (v_position_in_em_relative.x + v_position_in_em_relative.y) / (17.6 + 2.8)), 1.0); 
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_laengenReduktion'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_laengenReduktion, mati.calculateSpielerTextLaengenReduktion());
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'spieler') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);

                let namensblockX1 = koordinaten.x + 2;
                let namensblockX2 = koordinaten.x + 2 + 17.6;
                let namensblockY1 = koordinaten.y + 0.8;
                let namensblockY2 = koordinaten.y + koordinaten.height - 0.8;

                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [namensblockX1, namensblockY1],
                        a_position_in_em_relative : [0, 0],
                        a_farbe1 : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b],
                        a_farbe2 : [mati.farbeDunkel30.r, mati.farbeDunkel30.g, mati.farbeDunkel30.b]
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2, namensblockY1],
                        a_position_in_em_relative : [namensblockX2 - namensblockX1, 0],
                        a_farbe1 : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b],
                        a_farbe2 : [mati.farbeDunkel30.r, mati.farbeDunkel30.g, mati.farbeDunkel30.b]
                    },
                    {
                        a_position_in_em_absolute : [namensblockX1, namensblockY2],
                        a_position_in_em_relative : [0, namensblockY2 - namensblockY1],
                        a_farbe1 : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b],
                        a_farbe2 : [mati.farbeDunkel30.r, mati.farbeDunkel30.g, mati.farbeDunkel30.b]
                    },
                    {
                        a_position_in_em_absolute : [namensblockX2, namensblockY2],
                        a_position_in_em_relative : [namensblockX2 - namensblockX1, namensblockY2 - namensblockY1],
                        a_farbe1 : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b],
                        a_farbe2 : [mati.farbeDunkel30.r, mati.farbeDunkel30.g, mati.farbeDunkel30.b]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    spielerAvatar : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relativ;

            varying vec2 v_position_in_em_relativ;

            uniform vec2 u_screenSizeInEm;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                gl_Position = vec4(normalisierte2dKoordinaten, 0.0, 1.0);
                
                v_position_in_em_relativ = a_position_in_em_relativ;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_position_in_em_relativ;
            
            uniform vec3 u_farbe;
            uniform sampler2D u_image;
          
            void main() {
                float distanz = distance(v_position_in_em_relativ, vec2(2.2, 2.2));
                
                float schattenValue = (distanz - 1.4) / 0.8;
                schattenValue = clamp(schattenValue, 0.0, 1.0);
                schattenValue = 1.0 - schattenValue;
                schattenValue = schattenValue * 2.0;
                schattenValue = schattenValue * schattenValue;
                schattenValue = schattenValue / 2.0;
                schattenValue = clamp(schattenValue, 0.0, 1.0);
                vec4 schatten = vec4(0.0, 0.0, 0.0, schattenValue);
                
                float deckkraftRahmen = (distanz/1.8 - 0.98) * 50.0;
                deckkraftRahmen = 1.0 - clamp(deckkraftRahmen, 0.0, 1.0);
                vec4 rahmen = vec4(u_farbe, 1.0) * deckkraftRahmen;
                
                vec4 rahmenMitSchatten = schatten * (1.0 - rahmen.a) + rahmen;
                
                float deckkraftBild = (distanz/1.6 - 0.98) * 50.0;
                deckkraftBild = 1.0 - clamp(deckkraftBild, 0.0, 1.0);
                vec2 texKoordinaten = (v_position_in_em_relativ - .4) / 3.6;
                vec4 bild = texture2D(u_image, texKoordinaten) * deckkraftBild;
                
                gl_FragColor = rahmenMitSchatten * (1.0 - bild.a) + bild;
            }
        `,
    
        uniformNames : ['u_screenSizeInEm', 'u_farbe', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform3f(this.u_farbe, mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b);
            mati.gl.uniform1i(this.u_image, 2);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'spieler') {
                let circleX1 = .4;
                let circleX2 = 4;
                let circleY1 = .4;
                let circleY2 = 4;
                
                let shadow = 0.4;
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [circleX1 - shadow, circleY1 - shadow],
                        a_position_in_em_relativ : [0, 0]
                    },
                    {
                        a_position_in_em_absolute : [circleX2 + shadow, circleY1 - shadow],
                        a_position_in_em_relativ : [4.4, 0]
                    },
                    {
                        a_position_in_em_absolute : [circleX1 - shadow, circleY2 + shadow],
                        a_position_in_em_relativ : [0, 4.4]
                    },
                    {
                        a_position_in_em_absolute : [circleX2 + shadow, circleY2 + shadow],
                        a_position_in_em_relativ : [4.4, 4.4]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1, 1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },

    sprachAuswahl : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relative;

            varying vec2 v_position_in_em_relative;
            varying vec2 v_texKoordinatenOffset;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform float u_flagge_index;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition, 1.0 + rotatedPosition.z);
                
                v_position_in_em_relative = a_position_in_em_relative;
                
                float spalte = mod(u_flagge_index, 6.0);
                float zeile = floor(u_flagge_index / 6.0);

                v_texKoordinatenOffset = vec2(spalte * 320.0, zeile * 192.0);
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_position_in_em_relative;
            varying vec2 v_texKoordinatenOffset;
            
            uniform sampler2D u_image;
          
            void main() {
                
                vec2 centerPunkt1 = vec2(1.5, 1.5);
                vec2 centerPunkt2 = vec2(6.5, 1.5);
                float abstandZumCenter;
                if (v_position_in_em_relative.x < centerPunkt1.x) {
                    abstandZumCenter = distance(centerPunkt1, v_position_in_em_relative);
                }
                else if (v_position_in_em_relative.x > centerPunkt2.x) {
                    abstandZumCenter = distance(centerPunkt2, v_position_in_em_relative);
                }
                else {
                    abstandZumCenter = abs(v_position_in_em_relative.y - 1.5);
                }
                float deckkraftHintergrund = (abstandZumCenter/1.5 - 0.98) * 50.0;
                deckkraftHintergrund = 1.0 - clamp(deckkraftHintergrund, 0.0, 1.0);
                deckkraftHintergrund = deckkraftHintergrund * .5;
                
                
                
                
                vec4 hintergrund = vec4(0.0, 0.0, 0.0, 1.0) * deckkraftHintergrund;
                
                vec2 texKoordinatenInEm = v_position_in_em_relative + vec2(-1.5, 0.0);
                texKoordinatenInEm = clamp(texKoordinatenInEm, vec2(0.0, 0.0), vec2(5.0, 3.0));
                vec2 texKoordinatenInPx = texKoordinatenInEm * 64.0;
                texKoordinatenInPx = texKoordinatenInPx + v_texKoordinatenOffset;
                vec2 texKoordinatenNorm = texKoordinatenInPx / 2048.0;
                vec4 flagge = texture2D(u_image, texKoordinatenNorm);
                
                gl_FragColor = hintergrund * (1.0 - flagge.a) + flagge;
                
                
                
                

                
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_flagge_index', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            let flaggenIndex = 0;
            for (let sprache of mati.sprachen) {
                if (sprache.code === mati.spracheCode) {
                    flaggenIndex = mati.flags.indexOf(sprache.texte.data_flagge);
                    break;
                }
            }
            mati.gl.uniform1f(this.u_flagge_index, flaggenIndex);
            mati.gl.uniform1i(this.u_image, 1);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'sprachAuswahl') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_position_in_em_relative : [0, 0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_position_in_em_relative : [8, 0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [0, 3]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [8, 3]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    
    monocolor : {
        vertexShader : `
            precision mediump float;

            attribute vec2 a_position_in_em_absolute;
            attribute vec3 a_farbe;

            varying vec3 v_farbe;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform float u_zoom;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition * u_zoom, 1.0 + rotatedPosition.z);
                
                v_farbe = a_farbe;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec3 v_farbe;
            
            void main() {
                gl_FragColor = vec4(v_farbe, 1.0); 
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_zoom'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform1f(this.u_zoom, zoom);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'borderedBox') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);

                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x + .5, koordinaten.y + .5],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - .5, koordinaten.y + .5],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + .5, koordinaten.y + koordinaten.height - .5],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - .5, koordinaten.y + koordinaten.height - .5],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_farbe : [mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3,
                                            0, 6, 2,    2, 6, 4,
                                            3, 5, 1,    1, 5, 7,
                                            4, 6, 5,    5, 6, 7];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
            else if (elementObject.typ === 'sprachAuswahl') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);

                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x + .7, koordinaten.y + 1.5],
                        a_farbe : [1.0, 1.0, 1.0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + 1.5, koordinaten.y + .7],
                        a_farbe : [1.0, 1.0, 1.0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + 1.5, koordinaten.y + 2.3],
                        a_farbe : [1.0, 1.0, 1.0]
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - .7, koordinaten.y + 1.5],
                        a_farbe : [1.0, 1.0, 1.0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - 1.5, koordinaten.y + .7],
                        a_farbe : [1.0, 1.0, 1.0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - 1.5, koordinaten.y + 2.3],
                        a_farbe : [1.0, 1.0, 1.0]
                    },
                );
                let indexArrayOhneOffset = [0, 2, 1,
                                            3, 4, 5];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
            else if (elementObject.typ === 'pauseBackground') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);

                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_farbe : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_farbe : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_farbe : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_farbe : [mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    
    button : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relative;
            attribute float a_width_in_em;
            attribute float a_textline;
            attribute float a_unique_id;

            varying vec2 v_position_in_em_relative;
            varying float v_width_in_em;
            varying float v_textline;
            varying vec2 v_touchPosInEm_relative;
            varying float v_unique_id;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform float u_zoom;
            uniform vec2 u_touchPosInEm;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition * u_zoom, 1.0 + rotatedPosition.z);
                
                v_position_in_em_relative = a_position_in_em_relative;
                v_width_in_em = a_width_in_em;
                v_textline = a_textline;
                v_touchPosInEm_relative = u_touchPosInEm - a_position_in_em_absolute + a_position_in_em_relative;
                v_unique_id = a_unique_id;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_position_in_em_relative;
            varying float v_width_in_em;
            varying float v_textline;
            varying vec2 v_touchPosInEm_relative;
            varying float v_unique_id;
            
            uniform vec3 u_farbe;
            uniform vec3 u_zweitfarbe;
            uniform float u_button_mit_fokus;
            uniform sampler2D u_image;
          
            void main() {
                vec2 positionInEmVerzerrt;
                float distanz;
                float distanzNorm;
                float zerrwert;
                vec3 hintergrundfarbe;
                float schattenFuzzyness;
                
                float farbverlaufGeschwindigkeitY = min(1.0, v_width_in_em / 12.0);
                
                if (v_unique_id == u_button_mit_fokus) {
                    distanz = distance(v_position_in_em_relative, v_touchPosInEm_relative);
                    distanzNorm = distanz / v_width_in_em;
                    zerrwert = 1.0-distanzNorm;
                    zerrwert = 1.0 + zerrwert * zerrwert * zerrwert * .2;
                    positionInEmVerzerrt = (v_position_in_em_relative - v_touchPosInEm_relative) * zerrwert + v_touchPosInEm_relative;
                    
                    float widthInklusiveSchatten = v_width_in_em + 2.0;
                    float mittelpunktBewegungsfaktor = -(v_touchPosInEm_relative.x - v_width_in_em/2.0) / widthInklusiveSchatten * 2.0;
                    float x = (v_position_in_em_relative.x - v_width_in_em/2.0) / widthInklusiveSchatten*2.0 +mittelpunktBewegungsfaktor;
                    float y = (v_position_in_em_relative.y - v_touchPosInEm_relative.y) / widthInklusiveSchatten*2.0;
                    y = y * farbverlaufGeschwindigkeitY;
                    float a = mittelpunktBewegungsfaktor * mittelpunktBewegungsfaktor - 1.0;
                    float b = -2.0 * x * mittelpunktBewegungsfaktor;
                    float c = x * x + y * y;
                    float p = b / a;
                    float q = c / a;
                    float pHalbe = p / 2.0;
                    float rQuadrat = -pHalbe + sqrt(pHalbe*pHalbe - q);
                    float r = sqrt(rQuadrat);
                    hintergrundfarbe = mix(u_zweitfarbe, u_farbe, r);
                    
                    schattenFuzzyness = (distanzNorm * 2.0 + 1.0) / 3.0;
                }
                else {
                    positionInEmVerzerrt = v_position_in_em_relative;
                    
                    distanz = distance(vec2(v_position_in_em_relative.x, v_position_in_em_relative.y * farbverlaufGeschwindigkeitY), vec2(v_width_in_em/2.0, 1.5*farbverlaufGeschwindigkeitY));
                    distanzNorm = distanz / v_width_in_em * 2.0;
                    hintergrundfarbe = mix(u_farbe, u_zweitfarbe, distanzNorm);
                    
                    schattenFuzzyness = 1.0;
                }
            
                vec2 centerPunkt1 = vec2(1.5, 1.5);
                vec2 centerPunkt2 = vec2(v_width_in_em - 1.5, 1.5);
                float abstandZumCenter;
                if (positionInEmVerzerrt.x < centerPunkt1.x) {
                    abstandZumCenter = distance(centerPunkt1, positionInEmVerzerrt);
                }
                else if (positionInEmVerzerrt.x > centerPunkt2.x) {
                    abstandZumCenter = distance(centerPunkt2, positionInEmVerzerrt);
                }
                else {
                    abstandZumCenter = abs(positionInEmVerzerrt.y - 1.5);
                }
                float deckkraftButton = (abstandZumCenter/1.5 - 0.98) * 50.0;
                deckkraftButton = 1.0 - clamp(deckkraftButton, 0.0, 1.0);
                
                vec2 texKoordinatenInEm = positionInEmVerzerrt + vec2(8.0 - v_width_in_em/2.0, - .5);
                vec3 hintergrundMitText;
                if (texKoordinatenInEm.x >= 0.0
                        && texKoordinatenInEm.x <= 16.0
                        && texKoordinatenInEm.y >= 0.0
                        && texKoordinatenInEm.y <= 2.0) {
                    texKoordinatenInEm = texKoordinatenInEm + vec2(0.0, v_textline * 2.0);
                    vec2 texKoordinaten = texKoordinatenInEm / 32.0;
                    float textAlpha = texture2D(u_image, texKoordinaten).a;
                    hintergrundMitText = hintergrundfarbe * (1.0 - textAlpha);
                }
                else {
                    hintergrundMitText = hintergrundfarbe;
                }
                
                vec4 buttonMitText = vec4(hintergrundMitText, 1.0) * deckkraftButton;

                float doppelteDeckkraftSchattenSqrt = 1.0 - clamp(abstandZumCenter - 1.5, 0.0, schattenFuzzyness) / schattenFuzzyness;
                vec4 schatten = vec4(0.0, 0.0, 0.0, doppelteDeckkraftSchattenSqrt * doppelteDeckkraftSchattenSqrt * .5);

                gl_FragColor = buttonMitText + schatten * (1.0 - deckkraftButton);
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_zoom', 'u_touchPosInEm', 'u_farbe', 'u_zweitfarbe', 'u_button_mit_fokus', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform1f(this.u_zoom, zoom);
            mati.gl.uniform2f(this.u_touchPosInEm, mati.mouseposInEmX, mati.mouseposInEmY);
            mati.gl.uniform3f(this.u_farbe, mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b);
            mati.gl.uniform3f(this.u_zweitfarbe, mati.farbeHell50dunkel80.r, mati.farbeHell50dunkel80.g, mati.farbeHell50dunkel80.b);
            mati.gl.uniform1f(this.u_button_mit_fokus, mati.buttonMitFokus === null ? -1 : mati.buttonMitFokus.uniqueId);
            
            mati.gl.uniform1i(this.u_image, 0);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'bigButton' || elementObject.typ === 'smallButton') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x - 1, koordinaten.y - 1],
                        a_position_in_em_relative : [-1, -1],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine,
                        a_unique_id : elementObject.uniqueId
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + 1, koordinaten.y - 1],
                        a_position_in_em_relative : [koordinaten.width + 1, -1],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine,
                        a_unique_id : elementObject.uniqueId
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x - 1, koordinaten.y + koordinaten.height + 1],
                        a_position_in_em_relative : [-1, koordinaten.height + 1],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine,
                        a_unique_id : elementObject.uniqueId
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + 1, koordinaten.y + koordinaten.height + 1],
                        a_position_in_em_relative : [koordinaten.width + 1, koordinaten.height+ 1],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine,
                        a_unique_id : elementObject.uniqueId
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    schaetzungBalken : {
        vertexShader : `
            precision mediump float;

            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relative;
            attribute float a_width_in_em;
            attribute float a_zeige_wert_b;

            varying vec3 v_farbeHell;
            varying vec3 v_farbeDunkel;
            varying vec2 v_position_in_em_relative;
            varying float v_width_in_em;
            varying float v_zeige_wert_b;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform vec3 u_farbeHell1;
            uniform vec3 u_farbeHell2;
            uniform vec3 u_farbeDunkel;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition, 1.0 + rotatedPosition.z);
                
                v_farbeHell = mix(u_farbeHell1, u_farbeHell2, a_position_in_em_relative.y / 2.0);
                v_farbeDunkel = u_farbeDunkel;
                v_position_in_em_relative = a_position_in_em_relative;
                v_width_in_em = a_width_in_em;
                v_zeige_wert_b = a_zeige_wert_b;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec3 v_farbeHell;
            varying vec3 v_farbeDunkel;
            varying vec2 v_position_in_em_relative;
            varying float v_width_in_em;
            varying float v_zeige_wert_b;
            
            uniform float u_wert_a;
            uniform float u_wert_b;
            uniform float u_wert_a_float;
            uniform sampler2D u_image;
            
            void main() {
                float xPosNorm = v_position_in_em_relative.x / v_width_in_em;
                float fuellWertNorm;
                if (v_zeige_wert_b > 0.0) {
                    fuellWertNorm = (u_wert_a + u_wert_b - u_wert_a_float) / (u_wert_a + u_wert_b);
                }
                else {
                    fuellWertNorm = u_wert_a_float / (u_wert_a + u_wert_b);
                }
                
                vec2 texKoordinatenInEm = v_position_in_em_relative + vec2(1.0 - v_width_in_em/2.0, 0.0);
                vec3 hintergrundMitText;
                float textAlpha;
                if (texKoordinatenInEm.x >= 0.0
                        && texKoordinatenInEm.x <= 2.0
                        && texKoordinatenInEm.y >= 0.0
                        && texKoordinatenInEm.y <= 2.0) {
                    float wert = min(v_zeige_wert_b > 0.0 ? u_wert_b : u_wert_a, 79.0);
                    float spalte = mod(wert, 8.0);
                    float reihe = floor(wert / 8.0);
                    texKoordinatenInEm = texKoordinatenInEm + vec2(16.0 + spalte * 2.0, 0.0 + reihe * 2.0);
                    vec2 texKoordinaten = texKoordinatenInEm / 32.0;
                    textAlpha = texture2D(u_image, texKoordinaten).a;
                }
                else {
                    textAlpha = 0.0;
                }
                
                if (xPosNorm > fuellWertNorm) {
                    gl_FragColor = vec4(mix(v_farbeDunkel, v_farbeHell, textAlpha), 1.0); 
                }
                else {
                    gl_FragColor = vec4(mix(v_farbeHell, v_farbeDunkel, textAlpha), 1.0); 
                }
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_farbeHell1', 'u_farbeHell2', 'u_farbeDunkel', 'u_wert_a', 'u_wert_b', 'u_wert_a_float', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform3f(this.u_farbeHell1, mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b);
            mati.gl.uniform3f(this.u_farbeHell2, mati.farbeHell50dunkel80.r, mati.farbeHell50dunkel80.g, mati.farbeHell50dunkel80.b);
            mati.gl.uniform3f(this.u_farbeDunkel, mati.farbeDunkel30.r, mati.farbeDunkel30.g, mati.farbeDunkel30.b);
            mati.gl.uniform1f(this.u_wert_a, mati.schaetzungAntwortA);
            mati.gl.uniform1f(this.u_wert_b, mati.schaetzungAntwortB);
            mati.gl.uniform1f(this.u_wert_a_float, mati.schaetzungAntwortAFloat);
            mati.gl.uniform1i(this.u_image, 0);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'schaetzungBalken') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_position_in_em_relative : [0, 0],
                        a_width_in_em : koordinaten.width,
                        a_zeige_wert_b : elementObject.zeigeWertB
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_position_in_em_relative : [koordinaten.width, 0],
                        a_width_in_em : koordinaten.width,
                        a_zeige_wert_b : elementObject.zeigeWertB
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [0, koordinaten.height],
                        a_width_in_em : koordinaten.width,
                        a_zeige_wert_b : elementObject.zeigeWertB
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [koordinaten.width, koordinaten.height],
                        a_width_in_em : koordinaten.width,
                        a_zeige_wert_b : elementObject.zeigeWertB
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    text : {
        vertexShader : `
            precision mediump float;

            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_textur_pos;

            varying vec2 v_textur_pos;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition, 1.0 + rotatedPosition.z);
                
                v_textur_pos = a_textur_pos;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_textur_pos;

            uniform sampler2D u_image;
            
            void main() {
                float textAlpha = texture2D(u_image, v_textur_pos).a;
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * textAlpha; 
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform1i(this.u_image, 0);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'einzeiligerText') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let x1 = koordinaten.x + koordinaten.width/2 - 8;
                let x2 = koordinaten.x + koordinaten.width/2 + 8;
                let y1 = koordinaten.y;
                let y2 = koordinaten.y + koordinaten.height;
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [x1, y1],
                        a_textur_pos : [0, elementObject.textLine * 1/16]
                    },
                    {
                        a_position_in_em_absolute : [x2, y1],
                        a_textur_pos : [.5, elementObject.textLine * 1/16]
                    },
                    {
                        a_position_in_em_absolute : [x1, y2],
                        a_textur_pos : [0, elementObject.textLine * 1/16 + 1/16]
                    },
                    {
                        a_position_in_em_absolute : [x2, y2],
                        a_textur_pos : [.5, elementObject.textLine * 1/16 + 1/16]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
            if (elementObject.typ === 'mehrzeiligerText') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let x1 = koordinaten.x + koordinaten.width/2 - 8.5;
                let x2 = koordinaten.x + koordinaten.width/2 + 8.5;
                let y1 = koordinaten.y;
                let y2 = koordinaten.y + koordinaten.height;
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [x1, y1],
                        a_textur_pos : [15/32, elementObject.textLine * 1/8 + 10/16]
                    },
                    {
                        a_position_in_em_absolute : [x2, y1],
                        a_textur_pos : [1, elementObject.textLine * 1/8 + 10/16]
                    },
                    {
                        a_position_in_em_absolute : [x1, y2],
                        a_textur_pos : [15/32, elementObject.textLine * 1/8 + 12/16]
                    },
                    {
                        a_position_in_em_absolute : [x2, y2],
                        a_textur_pos : [1, elementObject.textLine * 1/8 + 12/16]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    soundButton : {
        vertexShader : `
            precision mediump float;

            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_textur_pos;

            varying vec2 v_textur_pos;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform float u_zoom;

            void main() {
                vec2 normalisierte2dKoordinaten = a_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                gl_Position = vec4(rotatedPosition * u_zoom, 1.0 + rotatedPosition.z);
                
                v_textur_pos = a_textur_pos;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_textur_pos;

            uniform float u_musik_eingeschaltet;
            uniform sampler2D u_image;
            
            void main() {
                float iconAlpha = texture2D(u_image, (v_textur_pos + vec2(0.0, 21.0)) / 32.0).a;
                float xAlpha = texture2D(u_image, (v_textur_pos + vec2(0.0, 25.0)) / 32.0).a  * (1.0 - u_musik_eingeschaltet);
                vec4 icon = vec4(1.0, 1.0, 1.0, 1.0) * iconAlpha;
                vec4 x = vec4(0.9, 0.1, 0.1, 1.0) * xAlpha;
                gl_FragColor = icon * (1.0-xAlpha) + x; 
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_zoom', 'u_musik_eingeschaltet', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            mati.gl.uniform1f(this.u_zoom, zoom);
            mati.gl.uniform1f(this.u_musik_eingeschaltet, mati.musikIstEingeschaltet ? 1 : 0);
            mati.gl.uniform1i(this.u_image, 0);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'soundButton') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_textur_pos : [0, 0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_textur_pos : [5, 0]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_textur_pos : [0, 3]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_textur_pos : [5, 3]
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    themeAuswahl : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relative;
            attribute float a_theme2_anzeigen;

            varying vec2 v_texturposition_norm;
            varying float v_opacity;

            uniform vec2 u_screenSizeInEm;
            uniform float u_rotation;
            uniform float u_offset_x_in_em_absolute;
            uniform float u_anzahl_texturspalten;
            uniform float u_theme1_index;
            uniform float u_theme2_index;

            void main() {
                float theme_index = mix(u_theme1_index, u_theme2_index, a_theme2_anzeigen);
                float theme_spalte = mod(theme_index, u_anzahl_texturspalten);
                float theme_reihe = floor(theme_index / u_anzahl_texturspalten);
                v_texturposition_norm = (1.0 / u_anzahl_texturspalten) * (a_position_in_em_relative / 16.0 + vec2(theme_spalte, theme_reihe * 0.5));
                
                vec2 echte_position_in_em_absolute = vec2(a_position_in_em_absolute.x + u_offset_x_in_em_absolute, a_position_in_em_absolute.y);
                
                vec2 normalisierte2dKoordinaten = echte_position_in_em_absolute / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                float sinRot = sin(-u_rotation);
                float cosRot = cos(-u_rotation);
                
                float xStrich = normalisierte2dKoordinaten.x * cosRot + sinRot;
                float zStrich = (normalisierte2dKoordinaten.x * sinRot - cosRot  + 1.0) * .3;
                vec3 rotatedPosition = vec3(xStrich, normalisierte2dKoordinaten.y, zStrich);
                
                
                
                float globalesOffsetXInEmAbsolut = a_position_in_em_absolute.x - a_position_in_em_relative.x + u_offset_x_in_em_absolute - (u_screenSizeInEm.x / 2.0 - 8.0);
                v_opacity = 1.0 - abs(globalesOffsetXInEmAbsolut / 20.0);
                
                gl_Position = vec4(rotatedPosition, 1.0 + rotatedPosition.z);
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_texturposition_norm;
            varying float v_opacity;
            
            uniform sampler2D u_image;
          
            void main() {
                gl_FragColor = texture2D(u_image, v_texturposition_norm) * v_opacity;
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_rotation', 'u_offset_x_in_em_absolute', 'u_anzahl_texturspalten', 'u_theme1_index', 'u_theme2_index', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_rotation, rotation);
            if (mati.lastDeltaThemeInThemeSelection === 0 || mati.lastDeltaThemeInThemeSelection === 1) {
                mati.gl.uniform1f(this.u_offset_x_in_em_absolute, (1-mati.themeIconsOffset) * -20);
                mati.gl.uniform1f(this.u_theme1_index, mati.altesTheme);
                mati.gl.uniform1f(this.u_theme2_index, mati.aktuellesTheme);
            }
            else {
                mati.gl.uniform1f(this.u_offset_x_in_em_absolute, mati.themeIconsOffset * -20);
                mati.gl.uniform1f(this.u_theme1_index, mati.aktuellesTheme);
                mati.gl.uniform1f(this.u_theme2_index, mati.altesTheme);
            }
            mati.gl.uniform1f(this.u_anzahl_texturspalten, mati.themeAnzahlTexturspalten);
            mati.gl.uniform1i(this.u_image, 3);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'themeIcon') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_position_in_em_relative : [0, 0],
                        a_theme2_anzeigen : elementObject.theme2 ? 1 : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_position_in_em_relative : [16, 0],
                        a_theme2_anzeigen : elementObject.theme2 ? 1 : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [0, 8],
                        a_theme2_anzeigen : elementObject.theme2 ? 1 : 0
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [16, 8],
                        a_theme2_anzeigen : elementObject.theme2 ? 1 : 0
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    
    pauseButton : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_shadow_vector;
            attribute vec2 a_shadow_vector_active;
            attribute vec2 a_position_in_em_relative;

            varying vec2 v_shadow_vector;
            varying vec2 v_position_in_em_relative;

            uniform vec2 u_screenSizeInEm;
            uniform float u_offsetX;
            uniform float u_active_float;

            void main() {
                vec2 posMitOffset = vec2(a_position_in_em_absolute.x + u_offsetX, a_position_in_em_absolute.y);
                vec2 normalisierte2dKoordinaten = posMitOffset / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                gl_Position = vec4(normalisierte2dKoordinaten, 0.0, 1.0);
                
                v_position_in_em_relative = a_position_in_em_relative;
                
                v_shadow_vector = mix(a_shadow_vector, a_shadow_vector_active, u_active_float);
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_shadow_vector;
            varying vec2 v_position_in_em_relative;
            
            uniform vec3 u_farbe1;
            uniform vec3 u_farbe2;
            uniform vec3 u_farbe3;
            uniform float u_active_float;
            uniform sampler2D u_image;
          
            void main() {
                float abstand = length(v_shadow_vector);
                
                float schattenValue = (abstand - .3) / .8;
                schattenValue = clamp(schattenValue, 0.0, 1.0);
                schattenValue = 1.0 - schattenValue;
                schattenValue = schattenValue * 2.0;
                schattenValue = schattenValue * schattenValue;
                schattenValue = schattenValue / 2.0;
                schattenValue = clamp(schattenValue, 0.0, 1.0);
                
                float einsMinusButtonDeckkraft = clamp((abstand - 0.66) * 25.0, 0.0, 1.0);
                float buttonDeckkraft = 1.0 - einsMinusButtonDeckkraft;
                
                vec2 texturePos = ((v_position_in_em_relative - vec2(.5, .5)) / 1.8 * 3.0 + vec2(0.0, 29.0)) / 32.0;
                texturePos.x = clamp(texturePos.x, 0.0, 3.0);
                texturePos.y = clamp(texturePos.y, 0.0, 3.0);
                float iconAlpha = texture2D(u_image, texturePos).a;

                float yAbstandZumCenter = abs((v_position_in_em_relative.x - 1.4) / 1.4);
                vec3 hintergrundfarbe = mix(u_farbe1, u_farbe2, yAbstandZumCenter);
                hintergrundfarbe = mix(hintergrundfarbe, u_farbe3, u_active_float);
                
                vec3 hintergrundfarbeMitIcon = mix(hintergrundfarbe, mix(vec3(0.0, 0.0, 0.0), u_farbe1, u_active_float), iconAlpha);
                
                vec4 button = vec4(hintergrundfarbeMitIcon, 1.0) * buttonDeckkraft;
                
                vec4 schatten = vec4(0.0, 0.0, 0.0, schattenValue);
                
                gl_FragColor = button + schatten * einsMinusButtonDeckkraft;
            }
        `,
    
        uniformNames : ['u_screenSizeInEm', 'u_offsetX', 'u_farbe1', 'u_farbe2', 'u_farbe3', 'u_active_float'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_offsetX, (1.0 - mati.pauseButtonEinblendenFloat) * 3.6);
            mati.gl.uniform3f(this.u_farbe1, mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b);
            mati.gl.uniform3f(this.u_farbe2, mati.farbeHell50dunkel80.r, mati.farbeHell50dunkel80.g, mati.farbeHell50dunkel80.b);
            mati.gl.uniform3f(this.u_farbe3, mati.farbeDunkel50.r, mati.farbeDunkel50.g, mati.farbeDunkel50.b);
            mati.gl.uniform1f(this.u_active_float, mati.pauseMenueIstAufgeklapptFloat);
            
            mati.gl.uniform1i(this.u_image, 0);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'pauseButton') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let shadow = 0.4;
                let buttonRadius = 0.7;
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y - shadow],
                        a_shadow_vector : [1.1, 1.1],
                        a_shadow_vector_active : [1.1, 1.1],
                        a_position_in_em_relative : [-shadow, -shadow]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + buttonRadius, koordinaten.y - shadow],
                        a_shadow_vector : [0, 1.1],
                        a_shadow_vector_active : [0, 1.1],
                        a_position_in_em_relative : [buttonRadius, -shadow]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - buttonRadius, koordinaten.y - shadow],
                        a_shadow_vector : [0, 1.1],
                        a_shadow_vector_active : [0, 1.1],
                        a_position_in_em_relative : [koordinaten.width - buttonRadius, -shadow]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y - shadow],
                        a_shadow_vector : [1.1, 1.1],
                        a_shadow_vector_active : [1.1, 1.1],
                        a_position_in_em_relative : [koordinaten.width + shadow, -shadow]
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + buttonRadius],
                        a_shadow_vector : [1.1, 0],
                        a_shadow_vector_active : [1.1, 0],
                        a_position_in_em_relative : [-shadow, buttonRadius]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + buttonRadius, koordinaten.y + buttonRadius],
                        a_shadow_vector : [0, 0],
                        a_shadow_vector_active : [0, 0],
                        a_position_in_em_relative : [buttonRadius, buttonRadius]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - buttonRadius, koordinaten.y + buttonRadius],
                        a_shadow_vector : [0, 0],
                        a_shadow_vector_active : [0, 0],
                        a_position_in_em_relative : [koordinaten.width - buttonRadius, buttonRadius]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + buttonRadius],
                        a_shadow_vector : [1.1, 0],
                        a_shadow_vector_active : [1.1, 0],
                        a_position_in_em_relative : [koordinaten.width + shadow, buttonRadius]
                    },
                    
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + koordinaten.width - buttonRadius],
                        a_shadow_vector : [1.1, 0],
                        a_shadow_vector_active : [1.1, 0],
                        a_position_in_em_relative : [-shadow, koordinaten.width - buttonRadius]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + buttonRadius, koordinaten.y + koordinaten.width - buttonRadius],
                        a_shadow_vector : [0, 0],
                        a_shadow_vector_active : [0, 0],
                        a_position_in_em_relative : [buttonRadius, koordinaten.width - buttonRadius]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - buttonRadius, koordinaten.y + koordinaten.width - buttonRadius],
                        a_shadow_vector : [0, 0],
                        a_shadow_vector_active : [0, 0],
                        a_position_in_em_relative : [koordinaten.width - buttonRadius, koordinaten.width - buttonRadius]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + koordinaten.width - buttonRadius],
                        a_shadow_vector : [1.1, 0],
                        a_shadow_vector_active : [1.1, 0],
                        a_position_in_em_relative : [koordinaten.width + shadow, koordinaten.width - buttonRadius]
                    },
                    
                    {
                        a_position_in_em_absolute : [koordinaten.x - shadow, koordinaten.y + koordinaten.height],
                        a_shadow_vector : [1.1, 1.9],
                        a_shadow_vector_active : [1.1, 0],
                        a_position_in_em_relative : [-shadow, koordinaten.height]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + buttonRadius, koordinaten.y + koordinaten.height],
                        a_shadow_vector : [0, 1.9],
                        a_shadow_vector_active : [0, 0],
                        a_position_in_em_relative : [buttonRadius, koordinaten.height]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width - buttonRadius, koordinaten.y + koordinaten.height],
                        a_shadow_vector : [0, 1.9],
                        a_shadow_vector_active : [0, 0],
                        a_position_in_em_relative : [koordinaten.width - buttonRadius, koordinaten.height]
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width + shadow, koordinaten.y + koordinaten.height],
                        a_shadow_vector : [1.1, 1.9],
                        a_shadow_vector_active : [1.1, 0],
                        a_position_in_em_relative : [koordinaten.width + shadow, koordinaten.height]
                    }
                );
                let indexArrayOhneOffset = [0, 4, 1,    1, 4, 5,
                                            1, 5, 2,    2, 5, 6,
                                            2, 6, 3,    3, 6, 7,
                                            8, 12, 9,   9, 12, 13,
                                            9, 13, 10,  10, 13, 14,
                                            10, 14, 11, 11, 14, 15,
                                            4, 8, 5,    5, 8, 9,
                                            5, 9, 6,    6, 9, 10,
                                            6, 10, 7,   7, 10, 11];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    },
    
    buttonEffekt : {
        vertexShader : `
            precision mediump float;
            
            attribute vec2 a_position_in_em_absolute;
            attribute vec2 a_position_in_em_relative;
            attribute float a_width_in_em;
            attribute float a_textline;

            varying vec2 v_position_in_em_relative;
            varying float v_width_in_em;
            varying float v_textline;

            uniform vec2 u_screenSizeInEm;
            uniform float u_zoomfaktor;

            void main() {
                float halbeWidth = .5 * a_width_in_em;
                vec2 mittelpunkt = a_position_in_em_absolute - a_position_in_em_relative + vec2(halbeWidth, 1.5);
                vec2 gezoomteKoordinatenInEm = (a_position_in_em_absolute - mittelpunkt) * u_zoomfaktor + mittelpunkt;
                
                vec2 normalisierte2dKoordinaten = gezoomteKoordinatenInEm / u_screenSizeInEm * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
                
                gl_Position = vec4(normalisierte2dKoordinaten, 0.0, 1.0);
                
                v_position_in_em_relative = a_position_in_em_relative;
                v_width_in_em = a_width_in_em;
                v_textline = a_textline;
            }
        `,
        fragmentShader : `
            precision mediump float;
          
            varying vec2 v_position_in_em_relative;
            varying float v_width_in_em;
            varying float v_textline;
            
            uniform float u_zoomfaktor;
            uniform vec3 u_farbe;
            uniform vec3 u_zweitfarbe;
            uniform sampler2D u_image;
          
            void main() {
                
                float distanz = distance(v_position_in_em_relative, vec2(v_width_in_em/2.0, 1.5));
                float distanzNorm = distanz / v_width_in_em * 2.0;
                vec3 hintergrundfarbe = mix(u_farbe, u_zweitfarbe, distanzNorm);
            
                vec2 centerPunkt1 = vec2(1.5, 1.5);
                vec2 centerPunkt2 = vec2(v_width_in_em - 1.5, 1.5);
                float abstandZumCenter;
                if (v_position_in_em_relative.x < centerPunkt1.x) {
                    abstandZumCenter = distance(centerPunkt1, v_position_in_em_relative);
                }
                else if (v_position_in_em_relative.x > centerPunkt2.x) {
                    abstandZumCenter = distance(centerPunkt2, v_position_in_em_relative);
                }
                else {
                    abstandZumCenter = abs(v_position_in_em_relative.y - 1.5);
                }
                float deckkraftButton = (abstandZumCenter/1.5 - 0.98) * 50.0;
                deckkraftButton = 1.0 - clamp(deckkraftButton, 0.0, 1.0);
                
                vec2 texKoordinatenInEm = v_position_in_em_relative + vec2(8.0 - v_width_in_em/2.0, - .5);
                texKoordinatenInEm = clamp(texKoordinatenInEm, vec2(0.0, 0.0), vec2(16.0, 2.0)) + vec2(0.0, v_textline * 2.0);
                vec2 texKoordinaten = texKoordinatenInEm / 32.0;
                float textAlpha = texture2D(u_image, texKoordinaten).a;
                
                vec4 buttonMitText = vec4(hintergrundfarbe * 1.0 - textAlpha, 1.0) * deckkraftButton;

                gl_FragColor = buttonMitText * (2.0 - u_zoomfaktor);
            }
        `,
        
        uniformNames : ['u_screenSizeInEm', 'u_zoomfaktor', 'u_farbe', 'u_zweitfarbe', 'u_image'],
        setUniforms : function(rotation, zoom) {
            mati.gl.uniform2f(this.u_screenSizeInEm, mati.windowWidthInEm, mati.windowHeightInEm);
            mati.gl.uniform1f(this.u_zoomfaktor, mati.buttonEffektZoom);
            mati.gl.uniform3f(this.u_farbe, mati.farbeHell50.r, mati.farbeHell50.g, mati.farbeHell50.b);
            mati.gl.uniform3f(this.u_zweitfarbe, mati.farbeHell50dunkel80.r, mati.farbeHell50dunkel80.g, mati.farbeHell50dunkel80.b);
            mati.gl.uniform1i(this.u_image, 0);
        },
        
        befuelleVertexArray : function(elementObject, verticesArray, indicesArray) {
            if (elementObject.typ === 'bigButton') {
                let koordinaten = mati.getRenderObjektKoordinatenInEm(elementObject);
                
                let indexOffset = verticesArray.length;
                
                verticesArray.push(
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y],
                        a_position_in_em_relative : [0, 0],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y],
                        a_position_in_em_relative : [koordinaten.width, 0],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [0, koordinaten.height],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine
                    },
                    {
                        a_position_in_em_absolute : [koordinaten.x + koordinaten.width, koordinaten.y + koordinaten.height],
                        a_position_in_em_relative : [koordinaten.width, koordinaten.height],
                        a_width_in_em : koordinaten.width,
                        a_textline : elementObject.textLine
                    }
                );
                let indexArrayOhneOffset = [0, 2, 1,    1, 2, 3];
                for (let indexArrayElement of indexArrayOhneOffset) {
                    indicesArray.push(indexArrayElement + indexOffset);
                }
            }
        }
    }
};