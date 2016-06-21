import React from 'react';
import Notes from '../../components/Notes/Notes';

import $ from 'jquery';

class ShareAppRoot extends React.Component {
  constructor() {
    super();
    this.state = {
      notes: [],
      metadata: null,
    };
    this.fetchNotes = this.fetchNotes.bind(this);
  }

  componentDidMount() {
    const targetEncodedUrl = window.location.hash.slice(1);
    if (!targetEncodedUrl) {
      // TODO show signs of URL absence
      return;
    }

    let targetUrl = '';
    try {
      targetUrl = atob(targetEncodedUrl);
    } catch (error) {
      // TODO show warning about invalid URL
    }
    // everything seems OK.
    this.fetchNotes(targetUrl);
  }

  fetchNotes(targetUrl) {
    $.ajax({
      url: targetUrl,
      dataType: 'json',
      cache: false,
      success: (data) => {
        this.setState({
          notes: data.annotations,
          metadata: data.metadata,
        });
      },
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
