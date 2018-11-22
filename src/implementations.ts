
export const implementations = [
  {
    name: 'Javascript',
    implementation: 'Javascript'
  },
  {
    name: 'Classic random',
    implementation: `
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
`
  },
  {
    name: 'Blixt random',
    implementation: `
highp float rands(vec2 value, float seed) {
  highp float dotValue = dot(value, vec2(1096.6331584285, 3020.29322778)) * (1.0 + seed);
  return fract(sin(mod(dotValue, 6.283185307179586)) * 59874.14171519782);
}
highp float rand(vec2 value) {
  return rands(value, 0.0);
}
`
  },
  {
    name: 'Dummy perfect distribution',
    implementation: `
highp float rand(vec2 co) {
  ivec2 pos = ivec2(co * outSize);
  int index = pos.y * int(outSize.x) + pos.x;
  return float(index) / (outSize.x * outSize.y);
}
`
  }
]