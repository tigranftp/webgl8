"use strict";
import * as webglUtils from "./webgl-utils.js";

const canvas = document.getElementById("pedestal");
initWebGl(canvas)

const vs = `
  attribute vec3 a_position;
  attribute vec2 aTexCoord;
  attribute vec3 a_normal;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  varying vec3 v_normal;
  varying vec2 vTexCoord;

  void main() {
    vTexCoord = aTexCoord;
    gl_Position = u_projection * u_view * u_world * vec4(a_position, 1.0);
    v_normal = normalize(mat3(u_world) * a_normal);
  }
  `;

const fs = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec2 vTexCoord;

  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;
  
  uniform sampler2D uNormalMap;

  void main () {
    vec3 normalMap = texture2D(uNormalMap, vTexCoord).rgb;
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    vec3 finalColor = u_diffuse.rgb * fakeLight;
    gl_FragColor = vec4(finalColor, u_diffuse.a);
  }
  `;


let meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

async function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */

    const response = await fetch('src/sphere.obj');
    const text = await response.text();
    const data = parseOBJ(text);
    console.log(data)

    // Because data is just named arrays like this
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // and because those names match the attributes in our vertex
    // shader we can pass it directly into `createBufferInfoFromArrays`
    // from the article "less code more fun".

    // create a buffer for each array by calling
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
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
    let bumpMapTexture = registerTexture("src//img//bump_map.jpg")

    let uNormalMapUniform = gl.getUniformLocation(meshProgramInfo.program, "uNormalMap");
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
        glMatrix.vec3.normalize(lightDir, [-1.0, 3.0, 5.0])
        const sharedUniforms = {
            u_lightDirection: lightDir,
            u_view: camera,
            u_projection: projection
        };

        gl.useProgram(meshProgramInfo.program);


        gl.uniform1i(uNormalMapUniform,  0);
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
            u_diffuse: [1, 0.647, 0.0, 1],
        });

        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
