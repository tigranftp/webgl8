let gl = null;

function initWebGl(canvas) {
    gl = canvas.getContext("webgl");

    if (!gl) {
        console.log("WebGL not supported")
        gl = canvas.getContext("experimental-webgl");
    }

    if (!gl) {
        alert("Your browser does not support WebGL");
    }

    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function loadShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error! Shader compile status ", gl.getShaderInfoLog(shader));
        return;
    }
    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Error! Link program", gl.getProgramInfoLog(shaderProgram));
        return;
    }

    gl.validateProgram(shaderProgram)
    if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS)) {
        console.error("Error! validate program", gl.getProgramInfoLog(shaderProgram));
        return;
    }

    return shaderProgram;
}

function initBuffersCube() {
    let squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

    let vertices =
        [ // X, Y, Z           X, Y, Z, U, V
            -10, -1, -10, 0, 1, 0, 1, 1,// 3
            10, -500, 1000, 0, 1, 0, 0, 0,// 8 //-30, 100
            10, -1, -10, 0, 1, 0, 0, 1, // 4

            -10, -1, -10, 0, 1, 0, 1, 1,// 3
            10, -500, 1000, 0, 1, 0, 0, 0,// 8 //-30, 100
            -10, -500, 1000, 0, 1, 0, 1, 0, // 7 //-30, 100
        ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}


// function setNormals() {
//     let normalsBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
//     let normals = new Float32Array([
//         // Front
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//
//         // Top
//         0, 1, 0,
//         0, 1, 0,
//         0, 1, 0,
//         0, 1, 0,
//         0, 1, 0,
//         0, 1, 0,
//
//         // Bottom
//         0, -1, 0,
//         0, -1, 0,
//         0, -1, 0,
//         0, -1, 0,
//         0, -1, 0,
//         0, -1, 0,
//
//         // Left
//         -1, 0, 0,
//         -1, 0, 0,
//         -1, 0, 0,
//         -1, 0, 0,
//         -1, 0, 0,
//         -1, 0, 0,
//
//         //Right
//         1, 0, 0,
//         1, 0, 0,
//         1, 0, 0,
//         1, 0, 0,
//         1, 0, 0,
//         1, 0, 0,
//
//         //Back
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,
//         0, 0, -1,]);
//     gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array(normals), gl.STATIC_DRAW);
// }

function enableVertexAttrib(shaderProgram, attributeName, size, stride, offset) {
    let attribLocation = gl.getAttribLocation(shaderProgram, attributeName);
    gl.vertexAttribPointer(
        attribLocation,
        size,
        gl.FLOAT,
        false,
        stride * Float32Array.BYTES_PER_ELEMENT,
        offset * Float32Array.BYTES_PER_ELEMENT
    );

    return attribLocation;
}


const angle = (degree) => {
    return degree * (Math.PI / 180);
}

function changeCoordsOfMatrix(mat4, vec3) {
    mat4[12] = vec3[0]
    mat4[13] = vec3[1]
    mat4[14] = vec3[2]
}


function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}



function registerTexture(imgSRC) {
    let texture = gl.createTexture();
    let image = new Image();
    image.onload = function () {
        handleTextureLoaded(image, texture);
    }
    image.src = imgSRC;
    return texture
}

function setTextures(imgSRC) {
    let texture = gl.createTexture();

    let image = new Image();
    image.onload = function () {
        handleTextureLoaded(image, texture);
       // gl.drawArrays(gl.TRIANGLES, 0, 40);
    }
    image.src = imgSRC;
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    gl.uniform1i(shaderProgram.samplerUniform,  0);
}


function parseOBJ(text) {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0, 0]];
    const objNormals = [[0, 0, 0]];

    // same order as `f` indices
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
    ];

    // same order as `f` indices
    let webglVertexData = [
        [],   // positions
        [],   // texcoords
        [],   // normals
    ];

    function newGeometry() {
        // If there is an existing geometry and it's
        // not empty then start a new one.
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
        setGeometry();
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
        });
    }

    const keywords = {
        v(parts) {
            objPositions.push(parts.map(parseFloat));
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {

            // should check for missing v and extra w?
            objTexcoords.push(parts.map(parseFloat).slice(0,2));
        },
        f(parts) {
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return {
        position: webglVertexData[0],
        texcoord: webglVertexData[1],
        normal: webglVertexData[2],
    };
}

