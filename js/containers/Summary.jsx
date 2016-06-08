import React from 'react';
import SummaryTable from '../components/SummaryTable';
import Notes from '../components/Notes';
import _ from 'lodash';
import Utils from '../utils';

class Summary extends React.Component {
  constructor () {
    super();
    this.state = {
      videos: [],
      playingVideoKey: Utils.base64Url(window.location),
      activeVideoKey: '',
      activeNotes: []
    };
    this.updateNotes = this.updateNotes.bind(this);
  }
  
  componentDidMount () {
    chrome.storage.local.get((data) => {
      let storage = _.cloneDeep(data);
      let storedAnnotations = [];
      let activeVideoKey = '';
      let activeNotes = [];
      
      Object.keys(storage).forEach((key) => {
        let value = storage[key];
        if (typeof value === 'object') {
          value.id = key;
          value.active = false;
          value.metadata.url = atob(key);
          
          // check if this one belongs to current window
          if (key === this.state.playingVideoKey) {
            value.active = true;
            activeVideoKey = key;
            activeNotes = value.annotations;
          }
          
          storedAnnotations.push(value);
        }        
      });

      this.setState({
        videos: storedAnnotations,
        activeVideoKey: activeVideoKey,
        activeNotes: activeNotes
      });
      
    });
  }

  updateNotes (e) {
    e.stopPropagation();
    let activeVideoKey = e.currentTarget.getAttribute('data-video-key');
    let activeNotes = null;
    let videos = this.state.videos.map((video) => {
      video.active = false;
      if (video.id === activeVideoKey) {
        activeNotes = video.annotations;
        video.active = true;
      }
      
      return video;
    });
    this.setState({
      videos,
      activeVideoKey,
      activeNotes
    });
  }
  
  render () {
    return (
        <div id="summary-table-wrapper">
          <h2>Annotations - Summary</h2>
          <div id="tableHolder">
            <SummaryTable videos={this.state.videos}
                          updateNotes={this.updateNotes} />
          </div>
          <Notes activeNotes={this.state.activeNotes} />
        </div>
    );
  }
};

export default Summary;
