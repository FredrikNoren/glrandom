import * as React from 'react';
import './App.css';
import samples from './samples.json';
import { sample } from './sample';

class Sampler extends React.Component {
  state = {
    sample: ''
  }
  sample = () => {
    this.setState({
      sample: JSON.stringify(sample(), null, 2)
    });
  }
  render() {
    if (!this.state.sample) {
      return <button onClick={this.sample}>Sample</button>;
    } else {
      return <div>
        <p>Insert this at then end of samples.json:</p>
        <textarea onClick={e => (e.target as HTMLTextAreaElement).select()} value={this.state.sample} />
        <p>Create a PR with this change to submit this sample.</p>
      </div>
    }
  }
}

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <Sampler />
        {JSON.stringify(samples)}
      </div>
    );
  }
}

export default App;
