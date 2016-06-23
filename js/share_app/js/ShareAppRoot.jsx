import React from 'react';
import Notes from '../../components/Notes/Notes';

class ShareAppRoot extends React.Component {
  constructor() {
    super();
    this.state = {
      notes: [],
      metadata: null,
    };
    this.processNotes = this.processNotes.bind(this);
  }

  componentDidMount() {
    const targetEncodedUrl = window.location.hash.slice(1);
    if (!targetEncodedUrl) {
      // TODO show signs of URL absense
      return;
    }

    let targetUrl = '';
    try {
      targetUrl = atob(targetEncodedUrl);
    } catch (error) {
      // TODO show warning about invalid URL
      return;
    }
    
    // everything seems OK.
    fetch(targetUrl).then(
      (response) => {
        if (response.status !== 200) {
          // TODO show fetch error
          return;
        }
        
        response.json().then(this.processNotes);
      }
    );
  }
  
  processNotes(notes) {
    this.setState({
      notes: notes.annotations,
      metadata: notes.metadata,
    });
  }
  
  render() {
    return (
      <Notes
        activeNotes={this.state.notes}
        showShareOption={false}
        showSearchBox={this.state.notes > 0}
      />
    );
  }
}

export default ShareAppRoot;
