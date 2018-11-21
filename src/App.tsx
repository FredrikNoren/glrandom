import * as React from 'react';
import './App.css';
import encodedSamples from './samples.json';
import { sample, encodeSample, decodeSample, Sample } from './sample';
import { RenderSamples } from './render';
const samples = encodedSamples.map(decodeSample);

class Sampler extends React.Component {
  state = {
    samples: [] as Sample[],
    samplesJson: '',
    sampling: false
  }
  sample = () => {
    this.setState({ sampling: true });
    setTimeout(() => {
      this.setState({
        samples: sample(),
        sampling: false
      });
    }, 100);
  }
  render() {
    if (this.state.samples.length === 0) {
      if (this.state.sampling) {
        return <div>Sampling...</div>;
      } else {
        return <button onClick={this.sample}>Create new sample</button>;
      }
    } else {
      return <div>
        <RenderSamples samples={this.state.samples} />
        {this.state.samplesJson ? <div>
          <p>Insert this at then end of samples.json:</p>
          <textarea onClick={e => (e.target as HTMLTextAreaElement).select()} value={this.state.samplesJson} />
          <p>Create a PR with this change to submit this sample.</p>
        </div> : <div>
          <button onClick={() => this.setState({ samplesJson: JSON.stringify(this.state.samples.map(encodeSample), null, 2) })}>
            Save these samples
          </button>
        </div>}
      </div>
    }
  }
}

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <Sampler />
        <RenderSamples samples={samples} />
      </div>
    );
  }
}

export default App;
