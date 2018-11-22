import * as React from 'react';
import { Sample } from './sample';
import { LineChart, XAxis, YAxis, Line, Tooltip } from 'recharts';

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

function LessThanGraph({ values }: { values: Float32Array }) {
  const data = [];
  for (let i = 1; i <= 6; i += 0.01) {
    const lowerCutoff = Math.pow(10, -i);
    const higherCutoff = 1 - lowerCutoff;
    const lowerCount = values.reduce((p, x) => p + (x < lowerCutoff ? 1 : 0), 0);
    const higherCount = values.reduce((p, x) => p + (x > higherCutoff ? 1 : 0), 0);
    data.push({ 
      lowerCutoff,
      higherCutoff,
      lowerCount,
      lowerP: (lowerCount / values.length) / lowerCutoff,
      higherCount,
      higherP: (higherCount / values.length) / lowerCutoff,
    });
  }
  return <LineChart width={800} height={300} data={data}>
    <XAxis dataKey="lowerCutoff" scale="log" />
    <YAxis yAxisId={0} dataKey="lowerP" type="number" domain={[0, 4]} allowDataOverflow={true} />
    <YAxis yAxisId={1} dataKey="higherP" type="number" domain={[0, 4]} allowDataOverflow={true} hide={true} />
    <Line yAxisId={0} type="monotone" dataKey="lowerP" stroke="#1f6fef" dot={false} />
    <Line yAxisId={1} type="monotone" dataKey="higherP" stroke="#e8720b" dot={false} />
    <Tooltip content={({ payload }: { payload: any }) => payload.length > 0 ? 
      <span>
        rand() &lt; {100*payload[0].payload.lowerCutoff}%: <br />
        {payload[0].payload.lowerP} <small>({payload[0].payload.lowerCount})</small><br/>
        rand() &gt; {100*payload[0].payload.higherCutoff}%: <br />
        {payload[0].payload.higherP} <small>({payload[0].payload.higherCount})</small><br/>
      </span> : null} />
  </LineChart>
}

function toHistogram(values: number[], buckets = 100) {
  const min = values.reduce((p, x) => Math.min(p, x), values[0]);
  const max = values.reduce((p, x) => Math.max(p, x), values[0]);
  const step = (max - min) / buckets;
  const hist = new Array(buckets).fill(0).map((_, i) => ({ from: min + i * step, to: min + (i + 1) * step, count: 0 }));
  let nMin = 0;
  let nMax = 0;
  for (const v of values) {
    if (v === min) {
      nMin++;
    } else if (v === max) {
      nMax++;
    }
    const p = (v - min) / (max - min);
    const i = Math.max(0, Math.min(buckets - 1, Math.floor(p * buckets)));
    hist[i].count++;
  }
  return { hist, nMin, nMax, min, max };
}


function Histogram2({ values }: { values: Float32Array }) {
  const sortedValues = Array.from(values);
  sortedValues.sort();
  const distances = [];
  for (let i = 0; i < sortedValues.length - 1; i++) {
    distances.push(sortedValues[i + 1] - sortedValues[i]);
  }
  const { hist } = toHistogram(Array.from(distances), 800);
  return <LineChart width={800} height={300} data={hist}>
    <XAxis dataKey="from" />
    <YAxis yAxisId={0} dataKey="count" />
    <Line yAxisId={0} type="monotone" dataKey="count" stroke="#1f6fef" dot={false} />
    <Tooltip content={({ payload }: { payload: any }) => payload.length > 0 ? 
      <span>
        {payload[0].payload.from} to {payload[0].payload.to}: {payload[0].payload.count}
      </span> : null} />
  </LineChart>
}

export function RenderSamples({ samples }: { samples: Sample[] }) {
  return <table>
    <tbody>
      <tr>
        <th>Name</th>
        <th>Implementation</th>
        <th>Img</th>
        <th>rand() &lt; X</th>
        <th>Histogram2</th>
      </tr>
      {samples.map((sample, i) => <tr key={i}>
        <td>{sample.implementationName}</td>
        <td><pre>{sample.implementation}</pre></td>
        <td><SamplesCanvas values={sample.values} width={sample.width} height={sample.height} /></td>
        <td><LessThanGraph values={sample.values} /></td>
        <td><Histogram2 values={sample.values} /></td>
      </tr>)}
    </tbody>
  </table>
}
