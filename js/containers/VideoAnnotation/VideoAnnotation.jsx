import React from 'react';
import ReactDOM from 'react-dom';

import SearchBox from '../../components/SearchBox/SearchBox';
import HelpMessage from './HelpMessage';
import UserInfo from './UserInfo';
import Annotations from './Annotations';
import Editor from './Editor';

import syncingData from '../../syncService.js';
import AppStorage from '../../localStorageUtils.js';
import Utils from '../../utils.js';


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
    this.onItemEdit = this.onItemEdit.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    
    this.onAnnotationCreate = this.onAnnotationCreate.bind(this);
    this.onAnnotationCancel = this.onAnnotationCancel.bind(this);
  }

  componentDidMount() {
    // set up both local storage and dropbox api wrappers
    this.storage = new AppStorage({ name: this.props.videoKey });
    this.dropboxFile = Utils.dropbox(this.props.videoKey);
    this.updateStorage();
    this.updateMetadata();
    
    // sync up all three sources (localStorage, dropbox, memory)
    this.syncNotes(this.storage, this.dropboxFile, this.state.notes, true);
    document.onkeydown = this.onKeyDown;
  }

  componentWillUnmount() {
  }

  onKeyDown(e) {
    if (e.altKey && e.key === 'd') {
      // bring up the editor to create a new annotation.
      e.preventDefault();
      this.insertEditor();
    }
  }
  
  onSearchBoxChange(e) {
    this.setState({
      searchQuery: e.target.value.toLowerCase(),
    });
  }

  onSeek(toTime) {
    this.videoTag.setCurrentTime(toTime);
  }

  onItemDelete(index) {
    const annotations = this.state.notes.annotations;
    const newAnnotations = annotations.slice(0, index)
                                      .concat(annotations.slice(index + 1));
    const notes = this.state.notes;
    notes.annotations = newAnnotations;
    this.setState({ notes });

    // sync up this change with other sources.
    this.syncNotes(false);
  }

  onItemEdit(index) {
    const annotation = this.state.notes.annotations[index];
    this.insertEditor(annotation);
  }

  onAnnotationCreate(_start_seconds, _text, annotation = null) {
    // Create a new annotation, insert it into the
    // existing list of annotations (or create one)
    let id = Date.now();
    let end_seconds = Number(this.videoTag.getCurrentTime());
    let start_seconds = _start_seconds;
    const text = _text;
    if (annotation) {
      id = annotation.id;
      start_seconds = annotation.start_seconds;
      end_seconds = annotation.end_seconds;
    }

    const start_minutes = Utils.minuteSeconds(start_seconds);
    const end_minutes = Utils.minuteSeconds(end_seconds);
    const annotationObj = {};
    Object.assign(
      annotationObj,
      { id, start_seconds, end_seconds, start_minutes, end_minutes },
      Utils.splitAnnotation(text)
    );

    // create a new list of annotations
    const oldList = this.state.notes.annotations;
    let newList = null;
    if (!annotation) {
      // in case this is a regular create (new annotation)
      newList = oldList
        .filter((eachAnnotation) =>
          eachAnnotation.start_seconds <= start_seconds
        )
        .concat([annotationObj])
        .concat(oldList.filter((eachAnnotation) =>
          eachAnnotation.start_seconds > start_seconds
        ));
    } else {
      // this is an update to the old annotation
      newList = oldList
        .map((eachAnnotation) => {
          if (eachAnnotation.id !== annotation.id) {
            return eachAnnotation;
          }
          return annotationObj; // the updated one
        });
    }

    // update the times in metadata
    const metadata = this.state.notes.metadata;
    const nowInString = new Date().toString();
    const creationTime = metadata.creationTime ?
                         metadata.creationTime : nowInString;
    const lastUpdate = nowInString;

    // finally, update the state with new data, and sync
    this.setState({
      notes: {
        annotations: newList,
        metadata: {
          creationTime,
          lastUpdate,
        },
      },
    }, this.syncNotes);
    
    // remove the Editor
    this.onAnnotationCancel();
  }

  onAnnotationCancel() {
    ReactDOM.unmountComponentAtNode(
      document.querySelector('.create-annotation')
    );
    this.videoTag.play();
  }

  insertEditor(annotation = null) {
    const start_seconds = annotation ?
                          annotation.start_seconds :
                          Number(this.videoTag.getCurrentTime());
    this.videoTag.pause();
    ReactDOM.render(
      <Editor
        handleAnnotationCreate={this.onAnnotationCreate}
        handleAnnotationCancel={this.onAnnotationCancel}
        annotation={annotation}
        start_seconds={start_seconds}
        videoTag={this.videoTag}
      />,
      document.querySelector('.create-annotation')
    );
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

  syncNotes(initialSync = false) {
    if (initialSync) {
      this.eventPromises = syncingData(
        this.storage,
        this.dropboxFile,
        this.state.notes,
        initialSync
      ).then((notes) => {
        if (notes) this.setState({ notes });
      });
    } else {
      syncingData(
        this.storage,
        this.dropboxFile,
        this.state.notes
      );
    }
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
            <div className="create-annotation"></div>
            <Annotations
              annotations={this.state.notes.annotations}
              searchQuery={this.state.searchQuery}
              videoTag={this.videoTag}
              handleItemDelete={this.onItemDelete}
              handleItemEdit={this.onItemEdit}
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
