import React from 'react';
import SummaryTable from '../components/SummaryTable';
import _ from 'lodash';

class Summary extends React.Component {
  constructor () {
    super();
    this.state = {
      annotations: []
    };
  }
  
  componentDidMount () {
    chrome.storage.local.get((data) => {
      let storage = _.cloneDeep(data);
      let storedAnnotations = [];
      
      Object.keys(storage).forEach((key) => {
        let value = storage[key];
        if (typeof value === 'object') {
          value.id = key;
          value.metadata.url = atob(key);
          storedAnnotations.push(value);
        }        
      });

      this.setState({
        annotations: storedAnnotations
      });
      
    });
  }
  
  render () {
    return (
        <div id="summary-table-wrapper">
          <h2>Annotations - Summary</h2>
          <div id="tableHolder">
            <SummaryTable annotations={this.state.annotations} />
          </div>
        </div>
    );
  }
};

export default Summary;
