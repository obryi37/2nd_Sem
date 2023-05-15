'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        if (normals != undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);
        }
        if (textures != undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);
        }

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iAttribTexture = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    this.iLight = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewMatrix = -1;
    this.iProjectionMatrix = -1;
    this.iNormalMatrix = -1;

    this.iTMU;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}
let projection, projectionLeft, projectionRight;
function setup3D() {
    let D = document;
    let spans = D.getElementsByClassName("slider-value");

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    let conv, // convergence
        eyes, // eye separation
        ratio, // aspect ratio
        fov; // field of view
    conv = 2000.0;
    conv = D.getElementById("conv").value;
    spans[3].innerHTML = conv;
    eyes = 70.0;
    eyes = D.getElementById("eyes").value;
    spans[0].innerHTML = eyes;
    ratio = 1.0;
    fov = Math.PI / 4;
    fov = D.getElementById("fov").value;
    spans[1].innerHTML = fov;
    let top, bottom, left, right, near, far;
    near = 10.0;
    near = D.getElementById("near").value - 0.0;
    spans[2].innerHTML = near;
    far = 20000.0;

    top = near * Math.tan(fov / 2.0);
    bottom = -top;

    let a = ratio * Math.tan(fov / 2.0) * conv;

    let b = a - eyes / 2;
    let c = a + eyes / 2;

    left = -b * near / conv;
    right = c * near / conv;

    projectionLeft = m4.orthographic(left, right, bottom, top, near, far);

    left = -c * near / conv;
    right = b * near / conv;

    projectionRight = m4.orthographic(left, right, bottom, top, near, far);
}

function CreateSurfaceData(normals, textures) {
    let vertexList = [],
        normalList = [],
        textureList = [];

    const R_START = 0.3,
        T_START = 0,
        R_FINISH = 1.2,
        T_FINISH = Math.PI * 2,
        R_STEP = 0.1,
        T_STEP = 0.1;

    for (let r = R_START; r < R_FINISH; r += R_STEP) {
        for (let t = T_START; t < T_FINISH; t += T_STEP) {
            let vert1 = richmondCylindrical(r, t);
            let vert2 = richmondCylindrical(r, t + T_STEP);
            let vert3 = richmondCylindrical(r + R_STEP, t);
            let vert4 = richmondCylindrical(r + R_STEP, t + T_STEP);
            vertexList.push(...vert1, ...vert2, ...vert3, ...vert3, ...vert4, ...vert2);

            if (textures != undefined) {
                let u = map(r, R_START, R_FINISH, 0, 1);
                let v = map(t, T_START, T_FINISH, 0, 1);
                textureList.push(u, v,)
                v = map(t + T_STEP, T_START, T_FINISH, 0, 1);
                textureList.push(u, v)
                u = map(r + R_STEP, R_START, R_FINISH, 0, 1);
                v = map(t, T_START, T_FINISH, 0, 1);
                textureList.push(u, v)
                textureList.push(u, v)
                v = map(t + T_STEP, T_START, T_FINISH, 0, 1);
                textureList.push(u, v)
                u = map(r, R_START, R_FINISH, 0, 1);
                textureList.push(u, v)
            }
            else if (normals != undefined) {
                let vert21 = m4.subtractVectors(vert2, vert1);
                let vert31 = m4.subtractVectors(vert3, vert1);
                let vert42 = m4.subtractVectors(vert4, vert2);
                let vert32 = m4.subtractVectors(vert3, vert2);
                let n1 = m4.cross(vert21, vert31);
                n1 = m4.normalize(n1);
                let n2 = m4.cross(vert42, vert32);
                n2 = m4.normalize(n2);
                normalList.push(...n1, ...n1, ...n1, ...n2, ...n2, ...n2);
            }
        }
    }
    if (textures != undefined) {
        return textureList;
    }
    else if (normals != undefined) {
        return normalList;
    }

    return vertexList;
}

function richmondCylindrical(r, t) {
    let vert = [
        -(Math.cos(-t) / (2.0 * r)) - ((r ** 3 * Math.cos(3 * t)) / 6.0),
        -(Math.sin(-t) / (2.0 * r)) + ((r ** 3 * Math.sin(3 * t)) / 6.0),
        r * Math.cos(t)
    ]
    return vert;
}

function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}

function createProgram(gl, vShader, fShader) {
    socket.on('rotationY', function (e) {
        rotationValY = e / 360 * (Math.PI * 2);
    })
    socket.on('rotationX', function (e) {
        rotationValX = e / 180 * (Math.PI * 2);
    })
    socket.on('rotationZ', function (e) {
        rotationValZ = e / 90 * (Math.PI * 2);
    })
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iLight = gl.getUniformLocation(prog, "light");

    LoadTexture();
    // requestDeviceOrientation()
    // getAccel()

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData(), CreateSurfaceData(1), CreateSurfaceData(1, 1));

    gl.enable(gl.DEPTH_TEST);
}

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        gl.viewport(0, 0, Math.min(window.innerHeight, window.innerWidth), Math.min(window.innerHeight, window.innerWidth));
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    // draw();
    anim()
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    // image.src = 'https://raw.githubusercontent.com/OBRYI/univer2022/CGW/textsq.jpg';
    image.src = 'https://raw.githubusercontent.com/OBRYI/univer2022/CGW/texture.jpg';
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}