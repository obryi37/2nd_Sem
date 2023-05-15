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

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let rotateAccelerometerY = m4.axisRotation([0, 1, 0], rotationValY);
    let rotateAccelerometerX = m4.axisRotation([1, 0, 0], rotationValX);
    let rotateAccelerometerZ = m4.axisRotation([0, 0, 1], rotationValZ);
    // let rotateAccelerometer = m4.multiply(m4.multiply(rotateAccelerometerY, rotateAccelerometerX), rotateAccelerometerZ);
    let translateToPointZero = m4.translation(-1.5, -1.5, -20);
    let translateToLeft = m4.translation(-0.03, 0, -20);
    let translateToRight = m4.translation(0.03, 0, -20);

    let matAccum = m4.multiply(rotateToPointZero, modelView);
    // let matAccum = m4.multiply(rotateAccelerometer, matAccum00);

    // let rotateWithTimeX = m4.axisRotation([1, 0, 0], Date.now() * 0.001);
    // let rotateWithTimeY = m4.axisRotation([0, 1, 0], Date.now() * 0.0003);
    // let rotateWithTimeZ = m4.axisRotation([0, 0, 1], Date.now() * 0.0005);

    // let matAccumX = m4.multiply(rotateWithTimeX, matAccum);
    let matAccumAX = m4.multiply(rotateAccelerometerX, matAccum);
    // let matAccumY = m4.multiply(rotateWithTimeY, matAccum);
    let matAccumAY = m4.multiply(rotateAccelerometerY, matAccum);
    // let matAccumZ = m4.multiply(rotateWithTimeZ, matAccum);
    let matAccumAZ = m4.multiply(rotateAccelerometerZ, matAccum);
    // let matAccumA = m4.multiply(matAccumAX, m4.multiply(matAccumAY, matAccumAZ))
    let matAccumA = getRotationMatrix(-rotationValX,-rotationValY,rotationValZ);
    // let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    let matAccum1 = m4.multiply(translateToPointZero, matAccumA);
    let matAccumLeft = m4.multiply(translateToLeft, matAccum1);
    let matAccumRight = m4.multiply(translateToRight, matAccum1);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    // gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);
    // gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);

    let matrixInversed = m4.inverse(modelViewProjection),
        matrixNormal = m4.transpose(matrixInversed);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, matrixNormal);

    gl.uniform1i(shProgram.iTMU, 0);

    gl.uniform3fv(shProgram.iLight, [3 * Math.cos(Date.now() * 0.001), 3 * Math.sin(Date.now() * 0.001), 1]);

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
}

function anim() {
    draw()
    window.requestAnimationFrame(anim);
}

/* Initialize the WebGL context. Called from init() */


function getAccel() {
    DeviceMotionEvent.requestPermission().then(response => {
        if (response == 'granted') {
            // Add a listener to get smartphone acceleration 
            // in the XYZ axes (units in m/s^2)
            // window.addEventListener('devicemotion', (event) => {
            //     console.log(event);
            // });
            socket.emit('rotation', "Magnetometer");
            // readAccelerometer();
            // Add a listener to get smartphone orientation 
            // in the alpha-beta-gamma axes (units in degrees)
            // window.addEventListener('deviceorientation', (event) => {
            //     console.log(event);
            //     socket.emit('rotation', event.alpha);
            // });
        }
    });
    socket.emit('rotation', "Buy")
    // DeviceOrientationEvent.requestPermission()
    //     .then(response => {
    //         console.log(response);
    //         if (response === 'granted') {
    //             console.log('Permission granted');
    //             window.addEventListener('deviceorientation', e => {
    //                 socket.emit('rotation', e.alpha);
    //             }, true);
    //         }
    //     }).catch((err => {
    //         console.log('Err', err);
    //     }));
}

function requestDeviceOrientation() {

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                console.log(response);
                if (response === 'granted') {
                    console.log('Permission granted');
                    socket.emit('rotation', 'Permission granted');
                    // readAccelerometer();
                    // window.addEventListener('devicemotion', (event) => {
                    //     // console.log(event);
                    //     socket.emit('rotation', event.acceleration.x);

                    // });
                    // window.addEventListener('deviceorientationabsolute', (event) => {
                    //     // console.log(event);
                    //     socket.emit('rotation', event.alpha);
                    // });
                    window.addEventListener('deviceorientation', e => {
                        socket.emit('rotationY', e.alpha);
                        socket.emit('rotationX', e.beta);
                        socket.emit('rotationZ', e.gamma);
                        // socket.emit('rotation', e);
                        // rotationValY = -e.alpha / 360 * (Math.PI * 2);
                        // rotationValX = -e.beta / 180 * (Math.PI * 2);
                        // rotationValZ = -e.gamma / 90 * (Math.PI * 2);
                    }, true);
                }
            }).catch((err => {
                console.log('Err', err);
            }));
    } else {
        socket.emit('rotation', "not Iphone");
        // readAccelerometer();
        window.addEventListener('deviceorientation', e => {
            // socket.emit('rotation', e.alpha);
            // socket.emit('rotationY', e);
            // socket.emit('rotationY', e.alpha);
            socket.emit('rotationX', e.beta);
            // socket.emit('rotationZ', e.gamma);
        }, true);
    }
}

// function getRotationMatrix(alpha, beta, gamma) {

// var _x = beta ?  deg2rad(beta) : 0; // beta value
// var _y = gamma ?  deg2rad(gamma) : 0; // gamma value
// var _z = alpha ?  eg2rad(alpha) : 0; // alpha value
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
const options = { frequency: 60, referenceFrame: "device" };
function readAccelerometer() {
    // socket.emit('rotation', "readingAccel");
    // sensor = new AbsoluteOrientationSensor(options);
    // sensor = new Magnetometer({ frequency: 60 });
    // sensor = new Gyroscope({ frequency: 60 });
    sensor = new Accelerometer({ frequency: 60 }); // working
    sensor.addEventListener("reading", () => {
        console.log('x: ' + sensor.x);
        console.log('y: ' + sensor.y);
        console.log('z: ' + sensor.z);
        socket.emit('rotation', sensor.x);
    })
    socket.on('rotation', function (sensor) {
        rotationVal += sensor.x
    })
    sensor.start();
    socket.emit('rotation', sensor.x);
    socket.emit('rotation', "WHAT");
}