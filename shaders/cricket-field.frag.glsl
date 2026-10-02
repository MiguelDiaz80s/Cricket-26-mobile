precision highp float;

uniform sampler2D uGrassTexture;
uniform sampler2D uDirtTexture;

// Directional sunlight in world/view space.
uniform vec3 uLightDirection;
uniform vec3 uLightColor;

// 1.0 = fully lit ambient contribution, lower values deepen contact/shadow areas.
uniform float uAmbientOcclusion;

// Match setup / pitch wear.
// 0.0 = fresh, 0.5 = used, 1.0 = very worn and dry.
uniform float uPitchCondition;

// Overall procedural crack visibility.
uniform float uCrackStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec4 vVertexColor;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float crackPattern(vec2 uv) {
    // Several scales make cracks feel less repetitive without a crack texture.
    float broad = noise2d(uv * 10.0);
    float medium = noise2d(uv * 34.0);
    float fine = noise2d(uv * 110.0);

    float lines = abs(medium - broad * 0.72);
    float branches = abs(fine - medium * 0.55);

    float mainCracks = 1.0 - smoothstep(0.035, 0.075, lines);
    float smallCracks = 1.0 - smoothstep(0.018, 0.045, branches);

    return clamp(mainCracks * 0.72 + smallCracks * 0.28, 0.0, 1.0);
}

void main() {
    vec3 grass = texture2D(uGrassTexture, vUv).rgb;
    vec3 dirt = texture2D(uDirtTexture, vUv).rgb;

    // Red vertex-channel is the field's grass -> pitch mask:
    // 0 = grass, 1 = pitch.
    float pitchMask = smoothstep(0.02, 0.98, clamp(vVertexColor.r, 0.0, 1.0));
    float condition = clamp(uPitchCondition, 0.0, 1.0);

    // Fresh pitches retain more colour; worn pitches become dry and dusty.
    vec3 freshDirt = dirt * vec3(0.94, 0.91, 0.82);
    vec3 wornDirt = dirt * vec3(1.07, 0.98, 0.82);
    vec3 pitchColor = mix(freshDirt, wornDirt, condition);

    // Fine surface breakup prevents the pitch from looking like a flat box.
    float surfaceVariation = noise2d(vUv * 65.0);
    pitchColor *= 0.91 + surfaceVariation * 0.16 * (0.35 + condition);

    // Cracks appear primarily on used/worn pitch.
    float cracks = crackPattern(vUv * vec2(1.0, 1.7));
    float visibleCracks = cracks * condition * uCrackStrength;
    pitchColor *= 1.0 - visibleCracks * 0.48;

    // Slightly dusty edge transition between grass and pitch.
    float edgeNoise = noise2d(vUv * 18.0);
    float softMask = clamp(pitchMask + (edgeNoise - 0.5) * 0.045, 0.0, 1.0);

    vec3 baseColor = mix(grass, pitchColor, softMask);

    // Directional lighting.
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDirection);
    float diffuse = max(dot(N, L), 0.0);

    // Ambient occlusion is deliberately soft so it does not crush the grass.
    float ao = clamp(uAmbientOcclusion, 0.0, 1.0);
    float ambient = mix(0.28, 0.55, ao);
    float lighting = ambient + diffuse * 0.72;

    vec3 litColor = baseColor * lighting;
    litColor *= mix(vec3(0.96, 1.0, 0.95), uLightColor, 0.72);

    // Cracks catch less light and therefore read as actual surface damage.
    litColor *= 1.0 - visibleCracks * 0.16;

    gl_FragColor = vec4(litColor, 1.0);
}
