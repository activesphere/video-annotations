import React from 'react';

import SearchBox from '../../components/SearchBox/SearchBox';
import HelpMessage from './HelpMessage';
import UserInfo from './UserInfo';
import Annotations from './Annotations';

import syncingData from '../../syncService.js';
import AppStorage from '../../localStorageUtils.js';
import Utils from '../../utils.js';

/* <HelpMessage /> */
/* <AnnotationEditor /> */

class VideoAnnotation extends React.Component {
  constructor() {
    super();
    this.state = {
      helpMessageShown: false,
      searchQuery: '',
      notes: {
        annotations: [],
        metadata: {
          creationTime: null,
          lastUpdate: null,
        },
      },
    };

    this.videoTag = Utils.getVideoInterface();
    
    this.toggleHelpMessage = this.toggleHelpMessage.bind(this);
    this.onSearchBoxChange = this.onSearchBoxChange.bind(this);
    this.onItemDelete = this.onItemDelete.bind(this);
    this.onSeek = this.onSeek.bind(this);
  }

  componentDidMount() {
    // set up both local storage and dropbox api wrappers
    this.storage = new AppStorage({ name: this.props.videoKey });
    this.dropboxFile = Utils.dropbox(this.props.videoKey);
    this.updateStorage();
    this.updateMetadata();
    
    // sync up all three sources (localStorage, dropbox, memory)
    this.eventPromises = syncingData(
      this.storage,
      this.dropboxFile,
      this.state.notes,
      true
    ).then((notes) => {
      this.setState({ notes });
    });
  }
  
  onSearchBoxChange(e) {
    this.setState({
      searchQuery: e.target.value.toLowerCase(),
    });
  }

  onItemDelete(index) {
    console.log('papa onItemDelete with index ', index);
    const annotations = this.state.notes.annotations;
    console.log('ann before ', annotations);
    const newAnnotations = annotations.slice(0, index)
                                      .concat(annotations.slice(index + 1));
    console.log('ann after ', newAnnotations);
    const notes = this.state.notes;
    notes.annotations = newAnnotations;
    this.setState({ notes });

    // sync up this change with other sources.
    syncingData(
      this.storage,
      this.dropboxFile,
      this.state.notes
    );
  }

  onSeek(toTime) {
    this.videoTag.setCurrentTime(toTime);
  }

  updateStorage() {
    this.storage.name = this.props.videoKey;
    this.dropboxFile.name = this.props.videoKey;
  }
  
  updateMetadata() {
    const host = Utils.hosts[window.location.hostname];
    const pagedata = Utils.getVideoInfo(host);
    const metadata = Object.assign(this.state.notes.metadata, pagedata);
    const notes = this.state.notes;
    notes.metadata = metadata;
    this.setState({ notes });
  }

  toggleHelpMessage() {
    this.setState({
      helpMessageShown: !this.state.helpMessageShown,
    });
  }
  
  render() {
    return (
      <div id="video-annotation">
        <div className="sidebar sidebar-hidden">
          <div className="annotations-list">
            <UserInfo />
            <SearchBox
              handleSearchBoxChange={this.onSearchBoxChange}
              searchQuery={this.state.searchQuery}
            />
            <div className="fa-container">
              <i
                className="fa fa-question toggle-info"
                title="Show Help"
                onClick={this.toggleHelpMessage}
              />
              <p
                className="toggle-highlight"
                title="Show descriptions for annotations made at current video duration"
              >Auto Highlight</p>
              <i className="toggle-highlight fa fa-check-square-o"></i>
            </div>
            <Annotations
              annotations={this.state.notes.annotations}
              searchQuery={this.state.searchQuery}
              videoTag={this.videoTag}
              handleItemDelete={this.onItemDelete}
              handleSeek={this.onSeek}
            />
            <HelpMessage visibility={this.state.helpMessageShown} />
          </div>
        </div>
      </div>
    );
  }
}

VideoAnnotation.propTypes = {
  videoKey: React.PropTypes.string.isRequired,
};

export default VideoAnnotation;
