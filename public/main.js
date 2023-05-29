/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
let rotationValY = 0;
let rotationValX = 0;
let rotationValZ = 0;
function draw() {

    setup3D();
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();
    let modelViewS = m4.identity();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);

    let translateToPointZero = m4.translation(-1.3, -1.3, -20);
    let translateToLeft = m4.translation(-0.03, 0, -0);
    let translateToRight = m4.translation(0.03, 0, -0);

    let matAccum = m4.multiply(rotateToPointZero, modelView);
    let matAccumS = m4.multiply(rotateToPointZero, modelViewS);

    let matAccumA = getRotationMatrix(-rotationValX, -rotationValY, rotationValZ);
    // console.log(matAccumA)

    let matAccum1 = m4.multiply(translateToPointZero, matAccum);
    let matAccum1S = m4.multiply(translateToPointZero, matAccumS);
    let matAccumLeft = m4.multiply(translateToLeft, matAccum1);
    let matAccumRight = m4.multiply(translateToRight, matAccum1);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    let matrixInversed = m4.inverse(modelViewProjection),
        matrixNormal = m4.transpose(matrixInversed);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, matrixNormal);

    gl.uniform1i(shProgram.iTMU, 0);

    gl.uniform3fv(shProgram.iLight, [3 * Math.cos(Date.now() * 0.001), 3 * Math.sin(Date.now() * 0.001), 1]);
    gl.uniform1f(shProgram.iS, 1.0);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccumLeft);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionLeft);
    gl.colorMask(true, false, false, false);
    surface.Draw();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccumRight);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionRight);
    gl.colorMask(false, true, true, false);
    surface.Draw();

    gl.colorMask(true, true, true, true);

    gl.uniform1f(shProgram.iS, -1.0);
    let soundPos = rotateVector(rotationValX, rotationValY, -rotationValZ)
    console.log(soundPos)
    if (panner) {
        panner.setPosition(soundPos[0], soundPos[1], soundPos[2]);
    }

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, m4.multiply(matAccum1S, m4.translation(soundPos[0], soundPos[1], soundPos[2])));
    soundSphere.Draw();
}

function anim() {
    draw()
    window.requestAnimationFrame(anim);
}

/* Initialize the WebGL context. Called from init() */
function requestDeviceOrientation() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                console.log(response);
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', e => {
                        socket.emit('rotationY', e.alpha);
                        socket.emit('rotationX', e.beta);
                        socket.emit('rotationZ', e.gamma);
                    }, true);
                }
            }).catch((err => {
                console.log('Err', err);
            }));
    } else {
        socket.emit('rotation', "not Iphone");
    }
}

function getRotationMatrix(x, y, z) {
    var _x = x; // beta value
    var _y = y; // gamma value
    var _z = z; // alpha value

    var cX = Math.cos(_x);
    var cY = Math.cos(_y);
    var cZ = Math.cos(_z);
    var sX = Math.sin(_x);
    var sY = Math.sin(_y);
    var sZ = Math.sin(_z);

    //
    // ZXY rotation matrix construction.
    //

    var m11 = cZ * cY - sZ * sX * sY;
    var m12 = - cX * sZ;
    var m13 = cY * sZ * sX + cZ * sY;

    var m21 = cY * sZ + cZ * sX * sY;
    var m22 = cZ * cX;
    var m23 = sZ * sY - cZ * cY * sX;

    var m31 = - cX * sY;
    var m32 = sX;
    var m33 = cX * cY;

    return [
        m11, m12, m13, 0,
        m21, m22, m23, 0,
        m31, m32, m33, 0,
        0, 0, 0, 1
    ];

};

let sensor;
var socket = io();
let context;
let D = document
let radioButton = D.getElementById('filter');
let audio = null,
    source,
    biquadFilter,
    panner;

function setupAudio() {
    audio = D.getElementById('favSong');

    audio.addEventListener('play', () => {
        if (!context) {
            context = new AudioContext();
            source = context.createMediaElementSource(audio);
            panner = context.createPanner();
            biquadFilter = context.createBiquadFilter();

            source.connect(panner);
            panner.connect(biquadFilter);
            biquadFilter.connect(context.destination);

            biquadFilter.type = 'lowshelf';
            biquadFilter.Q.value = 0.75;
            biquadFilter.frequency.value = 1000;
            biquadFilter.gain.value = 16;
            context.resume();
        }
    })


    audio.addEventListener('pause', () => {
        console.log('pause');
        context.resume();
    })
}

function initAudio() {
    setupAudio();
    radioButton.addEventListener('change', function () {
        if (radioButton.checked) {
            panner.disconnect();
            panner.connect(biquadFilter);
            biquadFilter.connect(context.destination);
        } else {
            panner.disconnect();
            panner.connect(context.destination);
        }
    });
    audio.play();
}