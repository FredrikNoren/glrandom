import { encode, decode } from 'base64-arraybuffer';
import { implementations } from './implementations';

function sampleRandImplementation(width: number, height: number, implementation: string) {

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
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
  uniform vec2 outSize;

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

  const outSizeL = gl.getUniformLocation(prog, 'outSize');
  if (outSizeL) {
    gl.uniform2f(outSizeL, width, height);
  }

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

export interface SampleBase {
  implementationName: string;
  implementation: string;
  width: number;
  height: number;
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
export interface EncodedSample extends SampleBase {
  base64values: string;
}
export interface Sample extends SampleBase {
  values: Float32Array;
}

export function encodeSample(sampl: Sample): EncodedSample {
  const v = {
    ...sampl,
    base64values: encode(sampl.values.buffer)
  };
  delete v.values;
  return v;
}
export function decodeSample(sampl: EncodedSample): Sample {
  const v = {
    ...sampl,
    values: new Float32Array(decode(sampl.base64values))
  };
  delete v.base64values;
  return v;
}

export function sample(): Sample[] {
  const width = 600;
  const height = 600;
  const common = {
    width,
    height,
    timestamp: Date.now(),
    navigator: {
      appName: window.navigator.appName,
      appVersion: window.navigator.appVersion,
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    },
    glInfo: detectGraphicsCard()
  };
  return implementations.map((impl): Sample => ({
    implementationName: impl.name,
    implementation: impl.implementation,
    values: impl.implementation === 'Javascript' ?
      new Float32Array(new Array(width * height).fill(0).map(_ => Math.random())) :
      sampleRandImplementation(width, height, impl.implementation),
    ...common
  }));
}
