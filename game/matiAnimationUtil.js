var matiAnimationUtil = {};

matiAnimationUtil.queues = {};

matiAnimationUtil.animate = function(parameter1, parameter2, parameter3) {
    var queueName = '';
    var rootAnimationObject;
    var callback;
    if (typeof parameter1 === 'string') {
        queueName = parameter1;
        rootAnimationObject = parameter2;
        callback = parameter3;
    }
    else {
        rootAnimationObject = parameter1;
        callback = parameter2;
    }
    
    if (queueName) {
        if (!matiAnimationUtil.queues[queueName]) {
            matiAnimationUtil.queues[queueName] = {
                abgebrochen : false,
                numberOfActiveAnimationObjects : 1,
                laufendeAnimationen : []
            };
        }
        else {
            matiAnimationUtil.queues[queueName].numberOfActiveAnimationObjects++;
        }
    }
    
    if (typeof rootAnimationObject === 'function') {
        rootAnimationObject();
        matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
        if (callback) {
            callback();
        }
    }
    else if (typeof rootAnimationObject === 'object') {
        if (Array.isArray(rootAnimationObject)) {
            if (rootAnimationObject[0] === 'parallel') {
                let zuBearbeitendeParalleleAufrufe = rootAnimationObject.length - 1;
                for (let i = 1; i < rootAnimationObject.length; i++) {
                    let listItemAnimationObject = rootAnimationObject[i];
                    matiAnimationUtil.animate(queueName, listItemAnimationObject, function() {
                        zuBearbeitendeParalleleAufrufe--;
                        if (zuBearbeitendeParalleleAufrufe === 0) {
                            matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
                            if (callback) {
                                callback();
                            }
                        }
                    });
                }
            }
            else if (rootAnimationObject[0] === 'successive') {
                if (rootAnimationObject.length === 1) {
                    //Liste ist leer (Rekursionsende erreicht)
                    matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
                    if (callback) {
                        callback();
                    }
                }
                else {
                    matiAnimationUtil.animate(queueName, rootAnimationObject[1], function() {
                        let neuerArray = rootAnimationObject.slice();
                        neuerArray.splice(1, 1);
                        matiAnimationUtil.animate(queueName, neuerArray, callback);
                        matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
                    });
                }
            }
        }
        else {
            if (queueName && matiAnimationUtil.queues[queueName].abgebrochen) {
                //Werte direkt zuweisen, ohne Animation
                if (rootAnimationObject.list) {
                    //Mehrere Werte zugleich aendern
                    for (let listElement of rootAnimationObject.list) {
                        rootAnimationObject.element.style[listElement.attribute] = listElement.end;
                    }
                }
                else {
                    rootAnimationObject.element.style[rootAnimationObject.attribute] = rootAnimationObject.end;
                }                
                
                matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
                if (callback) {
                    callback();
                }
            }
            else {
                let velocityAttributMap = {};
                if (typeof rootAnimationObject.list !== 'undefined') {
                    //Mehrere Werte zugleich aendern
                    for (let listElement of rootAnimationObject.list) {
                        if (typeof listElement.start !== 'undefined') {
                            velocityAttributMap[listElement.attribute] = [listElement.end, listElement.start];
                        }
                        else {
                            velocityAttributMap[listElement.attribute] = listElement.end;
                        }
                    }
                }
                else {
                    if (typeof rootAnimationObject.start !== 'undefined') {
                        velocityAttributMap[rootAnimationObject.attribute] = [rootAnimationObject.end, rootAnimationObject.start];
                    }
                    else {
                        velocityAttributMap[rootAnimationObject.attribute] = rootAnimationObject.end;
                    }
                }
                let velocityWeitereParameter = {};
                velocityWeitereParameter.duration = rootAnimationObject.duration;
                if (rootAnimationObject.easing) {
                    velocityWeitereParameter.easing = rootAnimationObject.easing;
                }
                else {
                    velocityWeitereParameter.easing = 'linear';
                }
            
                if (queueName) {
                    let generatedVelocityQueueName = queueName + '_queue' + new Date().getTime();
                    matiAnimationUtil.queues[queueName].laufendeAnimationen.push({
                        animationObject : rootAnimationObject,
                        generatedVelocityQueueName : generatedVelocityQueueName,
                        callback : callback
                    });
                    
                    velocityWeitereParameter.queue = generatedVelocityQueueName;
                    velocityWeitereParameter.complete = function() {
                        let i;
                        for (i=0; i<matiAnimationUtil.queues[queueName].laufendeAnimationen.length; i++) {
                            if (matiAnimationUtil.queues[queueName].laufendeAnimationen[i].animationObject === rootAnimationObject) {
                                break;
                            }
                        }
                        matiAnimationUtil.queues[queueName].laufendeAnimationen.splice(i, 1);

                        matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
                        if (callback) {
                            callback();
                        }
                    };
                }
                else {
                    velocityWeitereParameter.queue = false;
                    if (callback) {
                        velocityWeitereParameter.complete = callback;
                    }
                }
                Velocity(rootAnimationObject.element, velocityAttributMap, velocityWeitereParameter);
            }
        }
    }
};

matiAnimationUtil.finishQueue = function(queueName) {
    if (matiAnimationUtil.queues[queueName]) {
        matiAnimationUtil.queues[queueName].abgebrochen = true;

        //zunaechst alle Animationen stoppen
        for (let laufendeAnimation of matiAnimationUtil.queues[queueName].laufendeAnimationen) {
            let animationObject = laufendeAnimation.animationObject;
            let generatedVelocityQueueName = laufendeAnimation.generatedVelocityQueueName;
            Velocity(animationObject.element, 'stop', generatedVelocityQueueName);
        }
        
        while (matiAnimationUtil.queues[queueName] && matiAnimationUtil.queues[queueName].laufendeAnimationen.length) {
            let animationObject = matiAnimationUtil.queues[queueName].laufendeAnimationen[0].animationObject;
            let callback = matiAnimationUtil.queues[queueName].laufendeAnimationen[0].callback;
            matiAnimationUtil.queues[queueName].laufendeAnimationen.splice(0, 1);
            
            //Werte direkt zuweisen, ohne Animation
            if (animationObject.list) {
                //Mehrere Werte zugleich aendern
                for (let listElement of animationObject.list) {
                    animationObject.element.style[listElement.attribute] = listElement.end;
                }
            }
            else {
                animationObject.element.style[animationObject.attribute] = animationObject.end;
            }                
            
            matiAnimationUtil._cleanUpActiveAnimationObject(queueName);
            if (callback) {
                callback();
            }
        }
    }
};

matiAnimationUtil._cleanUpActiveAnimationObject = function(queueName) {
    if (queueName) {
        matiAnimationUtil.queues[queueName].numberOfActiveAnimationObjects--;
        if (matiAnimationUtil.queues[queueName].numberOfActiveAnimationObjects === 0) {
            delete matiAnimationUtil.queues[queueName];
        }
    }
};