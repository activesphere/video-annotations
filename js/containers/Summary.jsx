import React from 'react';
import SummaryTable from '../components/SummaryTable';
import Notes from '../components/Notes';
import _ from 'lodash';
import Utils from '../utils';


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
    this.onSearchBoxChange = this.onSearchBoxChange.bind(this);
  }
  
  componentDidMount() {
    /* global chrome */
    chrome.storage.local.get((data) => {
      const storage = _.cloneDeep(data);
      const storedAnnotations = [];
      let activeVideoKey = '';
      let activeNotes = [];
      // keys to skip from the chrome storage
      const keysToSkip = new Set([
        'dropbox_js_default_credentials',
        'dropbox_userinfo',
        'video-annotation',
      ]);
      
      Object.keys(storage).forEach((key) => {
        const value = storage[key];

        if (!keysToSkip.has(key)) {
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
        activeVideoKey,
        activeNotes,
      });
    });
  }
  
  onSearchBoxChange(e) {
    let summarySearchQuery = this.state.summarySearchQuery;
    let noteSearchQuery = this.state.noteSearchQuery;
    const whichBox = e.target.getAttribute('data-which');
    
    switch (whichBox) {
      case 'summarySearchBox':
        summarySearchQuery = e.target.value.toLowerCase();
        this.setState({ summarySearchQuery });
        break;
      case 'noteSearchBox':
        noteSearchQuery = e.target.value.toLowerCase();
        this.setState({ noteSearchQuery });
        break;
      default:
        throw new Error('ERROR: Missing a reference (data-which) on SearchBox');
    }
    /* this.setState({
     *   noteSearchQuery: summarySearchQuery.toLowerCase(),
     *   summarySearchQuery: noteSearchQuery.toLowerCase(),
     * });*/
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
      <div id="summary-table-wrapper">
        <h2>Annotations - Summary</h2>
        <div id="tableHolder">
          <SummaryTable
            videos={this.state.videos}
            updateNotes={this.updateNotes}
            searchQuery={this.state.summarySearchQuery}
            handleSearchBoxChange={this.onSearchBoxChange}
          />
        </div>
        <Notes
          activeNotes={this.state.activeNotes}
          searchQuery={this.state.noteSearchQuery}
          handleSearchBoxChange={this.onSearchBoxChange}
        />
      </div>
    );
  }
}

export default Summary;
