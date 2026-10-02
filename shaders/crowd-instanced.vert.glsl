#version 300 es
precision highp float;

layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in mat4 aInstanceModel;
layout(location=6) in vec3 aColorModifier;

uniform mat4 uViewProj;
uniform vec3 uLightPosition;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec3 vColor;

void main() {
    vec4 world = aInstanceModel * vec4(aPosition, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(aInstanceModel) * aNormal);
    vColor = aColorModifier;
    gl_Position = uViewProj * world;
}