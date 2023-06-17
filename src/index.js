"use strict";
import * as webglUtils from "./webgl-utils.js";

const canvas = document.getElementById("pedestal");
initWebGl(canvas)


let curShininess = 0.0
let curKA = 0.0
let curKD = 0.0
let curKS = 0.0
let meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);
let stepSize = 0.0

async function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const response = await fetch('src/sphere.obj');
    const text = await response.text();
    const data = parseOBJ(text);

    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);

    const cameraTarget = [0, 0, 0];
    const cameraPosition = [0, 0, 5];
    const zNear = 0.1;
    const zFar = 50;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }


    let u_world = new Float32Array(16);
    glMatrix.mat4.identity(u_world)
    let difAngle = 0.1
    let bumpMapTexture = registerTexture("src//img//Orange-bumpmap.png")

    let uNormalMapUniform = gl.getUniformLocation(meshProgramInfo.program, "uNormalMap");


    setAllRanges()

    function render(time) {
        time *= 0.001;  // convert to seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let projection = new Float32Array(16);
        glMatrix.mat4.perspective(projection, fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        // Compute the camera's matrix using look at.
        let camera = new Float32Array(16);
        glMatrix.mat4.lookAt(camera, cameraPosition, cameraTarget, up);

        // Make a view matrix from the camera matrix.

        let lightDir = [0, 0, 0]
        glMatrix.vec3.normalize(lightDir, [0, 0, 1])
        const sharedUniforms = {
            u_lightDirection: lightDir,
            u_view: camera,
            u_projection: projection,
            stepSize: stepSize
        };

        gl.useProgram(meshProgramInfo.program);


        gl.uniform1i(uNormalMapUniform, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bumpMapTexture);
        // calls gl.uniform
        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);

        glMatrix.mat4.rotate(u_world, u_world, angle(difAngle), [0, 1, 0]);
        // calls gl.uniform
        webglUtils.setUniforms(meshProgramInfo, {
            u_world: u_world,
            shininessVal: curShininess,
            Ka: curKA,
            Kd: curKD,
            Ks: curKS,
            ambientColor: [0.5, 0.3, 0.01],
            diffuseColor: [1, 0.55, 0.0],
            specularColor: [1.0, 1.0, 1.0],
        });

        webglUtils.drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();





function setAllRanges(){
    let shininessElement = document.getElementById('shininess')
    curShininess = shininessElement.value

    shininessElement.addEventListener("input", () => {
        curShininess = shininessElement.value
    });

    let kaElement = document.getElementById('KA')
    curKA = kaElement.value / 1000

    kaElement.addEventListener("input", () => {
        curKA = kaElement.value / 1000
    });


    let kdElement = document.getElementById('KD')
    curKD = kdElement.value / 1000

    kdElement.addEventListener("input", () => {
        curKD = kdElement.value / 1000
    });


    let ksElement = document.getElementById('KS')
    curKS = ksElement.value / 1000

    ksElement.addEventListener("input", () => {
        curKS = ksElement.value / 1000
    });


    document.addEventListener('keydown', (event) => {
        let key = event.key;
        switch (key) {
            case "B":
            case "b":
            case "и":
            case "И":
                console.log(key)
        }
    })
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
        stepSize = (1.0 / (image.width))
    }
    image.src = imgSRC;
    return texture
}