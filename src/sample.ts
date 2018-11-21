import { encode } from 'base64-arraybuffer';

const sampleSizeSqrt = 600;
const sampleSize = sampleSizeSqrt * sampleSizeSqrt;

function sampleRandImplementation(implementation: string) {

  const canvas = document.createElement('canvas');
  canvas.width = sampleSizeSqrt;
  canvas.height = sampleSizeSqrt;
  const gl = canvas.getContext("webgl2") as any as WebGL2RenderingContext;

  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error('EXT_color_buffer_float unavailable');
  }

  const quadPositionsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, 1,
  ]), gl.STATIC_DRAW);

  function shaderFromSource(type: 'vertex' | 'fragment', sourceCode: string): WebGLShader {
    const shader = gl.createShader(type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    if (!shader) {
      throw new Error('Null shader returned');
    }
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // tslint:disable-next-line:no-console
      console.error(sourceCode.split('\n').map((x, i) => (i + 1) + ': ' + x).join('\n'));
      throw new Error('Could not compile shader. \n\n' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createProgram(shaders: WebGLShader[]): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Null program');
    }
    for (const shader of shaders) {
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Could not compile WebGL program. \n\n' + gl.getProgramInfoLog(program));
    }
    return program;
  }


  const vertexShader = shaderFromSource('vertex', `#version 300 es
  in vec2 position;
  out vec2 texcoord;

  void main() {
    texcoord = (position + 1.0) / 2.0;
    gl_Position = vec4(position, 0.0, 1.0);
  }
  `);

  const fragmentShader = shaderFromSource('fragment', `#version 300 es
  precision highp float;
  in vec2 texcoord;
  out vec4 out_value;

  ${implementation}

  void main() {
    out_value = vec4(rand(texcoord), 0, 0, 1);
  }
  `);

  const prog = createProgram([vertexShader, fragmentShader]);

  gl.useProgram(prog);

  const positionAL = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(positionAL);
  gl.vertexAttribPointer(positionAL, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, canvas.width, canvas.height, 0, gl.RED, gl.FLOAT, null);

  const readBuff = new Float32Array(canvas.width * canvas.height * 4);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.readBuffer(gl.COLOR_ATTACHMENT0);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.FLOAT, readBuff);
  const values = new Float32Array(canvas.width * canvas.height);
  for (let i=0; i < canvas.width * canvas.height; i++) {
    values[i] = readBuff[i * 4];
  }

  return values;
}

function detectGraphicsCard() {
  const canvas = document.createElement('canvas');
  
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  const debugInfo = gl!.getExtension('WEBGL_debug_renderer_info')!;
  return {
    vendor: gl!.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    renderer: gl!.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  }
}

export interface EncodedSample {
  implementation: string;
  base64values: string;
  timestamp: number;
  navigator: {
    appName: string,
    appVersion: string,
    platform: string,
    userAgent: string,
  };
  glInfo: {
    vendor: string,
    renderer: string
  }
}

export function sample(): EncodedSample[] {
  const common = {
    timestamp: Date.now(),
    navigator: {
      appName: window.navigator.appName,
      appVersion: window.navigator.appVersion,
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    },
    glInfo: detectGraphicsCard()
  }
  return [
    {
      implementation: 'Javascript',
      base64values: encode(new Float32Array(new Array(sampleSize).fill(0).map(_ => Math.random())).buffer),
      ...common
    },
    {
      implementation: 'Classic random',
      base64values: encode(sampleRandImplementation(`
        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }
      `).buffer),
      ...common
    },
    {
      implementation: 'Blixt random',
      base64values: encode(sampleRandImplementation(`
        highp float rands(vec2 value, float seed) {
          highp float dotValue = dot(value, vec2(1096.6331584285, 3020.29322778)) * (1.0 + seed);
          return fract(sin(mod(dotValue, 6.283185307179586)) * 59874.14171519782);
        }
        highp float rand(vec2 value) {
          return rands(value, 0.0);
        }
      `).buffer),
      ...common
    }
  ];
}

// function serializeSample(sample: Sample): string {
//   return JSON.stringify(implementations.map(impl => ({
//     ...impl,
//     base64values: encode(impl.values)
//   })))
// }
