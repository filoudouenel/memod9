import React, { Component } from 'react';
import ReactDiffViewer from 'react-diff-viewer';
class Diff extends Component {
  state = {}
  render() {
    return (
      <div >
        <ReactDiffViewer oldValue={this.props.ancien}
          newValue={this.props.nouveau}
          splitView={true}
          leftTitle="Bonne réponse"
          rightTitle="Votre réponse"
        />
      </div>

    );
  }
}

export default Diff;
