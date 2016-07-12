import React from 'react';
import SummaryTable from '../../components/SummaryTable/SummaryTable';
import Notes from '../../components/Notes/Notes';
import _ from 'lodash';
import Utils from '../../utils';
import CONSTANTS from '../../constants';


class Summary extends React.Component {
  constructor() {
    super();
    this.state = {
      videos: [],
      playingVideoKey: Utils.base64Url(window.location),
      activeVideoKey: '',
      activeNotes: [],
      summarySearchQuery: '',
      noteSearchQuery: '',
    };
    this.updateNotes = this.updateNotes.bind(this);
  }
  
  componentDidMount() {
    /* global chrome */
    chrome.storage.local.get((data) => {
      const storage = _.cloneDeep(data);
      let activeVideoKey = '';
      let activeNotes = [];
      
      const storedAnnotations = Object
        .keys(storage)
        .filter((key) => !CONSTANTS.localStorageNonVideoKeys.has(key))
        .map((key) => {
          const value = storage[key];
          value.id = key;
          value.active = false;
          value.metadata.url = atob(key);
          // check if this one belongs to current window
          if (key === this.state.playingVideoKey) {
            value.active = true;
            activeVideoKey = key;
            activeNotes = value.annotations;
          }
          return value;
        });
      
      this.setState({
        videos: storedAnnotations,
        activeVideoKey,
        activeNotes,
      });
    });
  }
  
  updateNotes(e) {
    e.stopPropagation();
    const activeVideoKey = e.currentTarget.getAttribute('data-video-key');
    let activeNotes = null;
    const videos = this.state.videos.map((video) => {
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
      activeNotes,
    });
  }

  render() {
    return (
      <div className="summary-table-wrapper">
        <h2>Annotations - Summary</h2>
        <div className="tableHolder">
          <SummaryTable
            videos={this.state.videos}
            updateNotes={this.updateNotes}
          />
        </div>
        <Notes
          activeNotes={this.state.activeNotes}
          activeNotesKey={this.state.activeVideoKey}
        />
      </div>
    );
  }
}

export default Summary;
