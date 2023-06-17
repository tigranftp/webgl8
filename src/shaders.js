const vs = `
  attribute vec3 a_position;
  attribute vec2 a_texcoord;
  attribute vec3 a_normal;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  varying vec3 v_normal;
  varying vec2 v_texcoord;
  varying vec3 vertPos;

  void main() {
    vec4 vertPos4 = u_view * vec4(a_position, 1.0);
    vertPos = vec3(vertPos4) / vertPos4.w;
    v_texcoord = a_texcoord;
    gl_Position = u_projection * u_view * u_world * vec4(a_position, 1.0);
    v_normal = normalize(mat3(u_world) * a_normal);
  }
  `;

const fs = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec2 v_texcoord;
  varying vec3 vertPos;  

  uniform vec3 u_lightDirection;
  uniform float Ka;   // Ambient reflection coefficient
  uniform float Kd;   // Diffuse reflection coefficient
  uniform float Ks;   // Specular reflection coefficient
  uniform vec3 ambientColor;
  uniform vec3 diffuseColor;
  uniform vec3 specularColor;
  uniform float shininessVal;
  uniform float stepSize;
  uniform sampler2D uNormalMap;

  void main () {

  vec3 xGradient = texture2D(uNormalMap, vec2(v_texcoord.x - stepSize, v_texcoord.y)).xyz - texture2D(uNormalMap, vec2(v_texcoord.x + stepSize, v_texcoord.y)).xyz;
  vec3 yGradient = texture2D(uNormalMap, vec2(v_texcoord.x, v_texcoord.y - stepSize)).xyz - texture2D(uNormalMap, vec2(v_texcoord.x, v_texcoord.y + stepSize)).xyz;
  
    vec3 normalMap = v_normal + v_texcoord.x * xGradient + v_texcoord.y * yGradient;
    vec3 N =  normalize(normalMap * 2.0 - 1.0);
    vec3 L = normalize(u_lightDirection);
    float lambertian = max(dot(N, L), 0.0);
    float specular = 0.0;
    if(lambertian > 0.0) {
      vec3 R = normalize(reflect(-L, N));      // Reflected light vector
      vec3 V = normalize(-vertPos); // Vector to viewer
      float specAngle = max(dot(R, V), 0.0);
      specular = pow(specAngle, shininessVal);
    }
    
    gl_FragColor = vec4(Ka * ambientColor +
                      Kd * lambertian * diffuseColor +
                      Ks * specular * specularColor, 1.0);
  }
  `;
