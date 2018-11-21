import * as React from 'react';
import { Sample } from './sample';

function SamplesCanvas({ values, width, height }: { values: Float32Array, width: number, height: number }) {
  return <canvas width={width} height={height} ref={e => {
    const imageData = new ImageData(width, height);
    for (let i = 0; i < values.length; i++) {
      imageData.data[i * 4 + 0] = values[i] * 255;
      imageData.data[i * 4 + 1] = values[i] * 255;
      imageData.data[i * 4 + 2] = values[i] * 255;
      imageData.data[i * 4 + 3] = 255;
    }
    const ctx = e!.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
  }} />
}

export function RenderSamples({ samples }: { samples: Sample[] }) {
  const exponents = new Array(7).fill(0).map((_, i) => Math.pow(10, -i)).slice(1);
  const comparisons = [...exponents.map(c => ({ c, expected: c, cmp: '<' })), ...exponents.map(c => ({ c: 1 - c, expected: c, cmp: '>' }))];
  return <table>
    <tbody>
      <tr>
        <th>Implementation</th>
        <th>Img</th>
        {comparisons.map(({ c, cmp }, i) => <th key={i}>rand() {cmp} {c}</th>)}
      </tr>
      {samples.map((sample, i) => <tr key={i}>
        <td>{sample.implementation}</td>
        <td><SamplesCanvas values={sample.values} width={sample.width} height={sample.height} /></td>
        {comparisons.map(({ c, expected, cmp }, l) => {
          const compare = (a: number, b: number) => cmp === '<' ? a < b : a > b;
          const count = sample.values.reduce((p, x) => p + (compare(x, c) ? 1 : 0), 0);
          return <td key={l}>
            {((count / sample.values.length) / expected).toFixed(3)} <small>({count})</small>
          </td>;
        })}
      </tr>)}
    </tbody>
  </table>
}
