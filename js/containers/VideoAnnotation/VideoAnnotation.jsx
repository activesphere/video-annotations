import React from 'react';
import ReactDOM from 'react-dom';

import SearchBox from '../../components/SearchBox/SearchBox';
import Editor from '../../components/Editor/Editor';

import HelpMessage from '../../components/HelpMessage/HelpMessage';
import UserInfo from '../../components/UserInfo/UserInfo';
import Annotations from '../../components/Annotations/Annotations';
import Utils from '../../utils';

import './VideoAnnotation.less';

import { changeSearchQuery, toggleHelpMessage,
         editAnnotation, addAnnotation } from '../../actions';


class VideoAnnotation extends React.Component {
  constructor() {
    super();
    this.videoTag = Utils.getVideoInterface();
    
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onAnnotationCreate = this.onAnnotationCreate.bind(this);
    this.insertEditor = this.insertEditor.bind(this);
    this.removeEditor = this.removeEditor.bind(this);
  }
  
  componentDidMount() {
    this.unsubscribe = this.store.subscribe(() => this.forceUpdate());
    document.onkeydown = this.onKeyDown;
  }

  componentWillUnmount() { this.unsubscribe(); }

  onKeyDown(e) {
    if (e.altKey && e.key === 'd') {
      // bring up the editor to create a new annotation.
      e.preventDefault();
      this.insertEditor();
    }
  }

  onAnnotationCreate(start_seconds, text, editId) {
    const state = this.store.getState();
    if (editId) {
      // this is to edit, not to create
      this.store.dispatch(editAnnotation(
        editId,
        text,
        state.metadata
      ));
    } else {
      // creating a new note
      this.store.dispatch(addAnnotation(
        text,
        state.metadata,
        start_seconds,
        this.videoTag.getCurrentTime()
      ));
    }
    
    // remove editor
    this.removeEditor();
  }

  insertEditor(annotation = null) {
    const start_seconds = annotation ?
                          annotation.start_seconds :
                          Number(this.videoTag.getCurrentTime());
    this.videoTag.pause();
    ReactDOM.render(
      <Editor
        handleAnnotationCreate={this.onAnnotationCreate}
        handleAnnotationCancel={this.removeEditor}
        annotation={annotation}
        start_seconds={start_seconds}
        videoTag={this.videoTag}
      />,
      document.querySelector('.create-annotation')
    );
  }

  removeEditor() {
    ReactDOM.unmountComponentAtNode(
      document.querySelector('.create-annotation')
    );
    this.videoTag.play();
  }
  
  render() {
    this.store = this.context.store;
    const state = this.store.getState();
    return (
      <div id="video-annotation">
        <div className="sidebar sidebar-visible">
          <div className="annotations-list">
            <UserInfo />
            <SearchBox
              handleSearchBoxChange={(e) => {
                this.store.dispatch(changeSearchQuery(
                  e.target.value.toLowerCase()
                ));
              }}
              searchQuery={state.searchQuery}
            />
            <div className="fa-container">
              <i
                className="fa fa-question toggle-info"
                title="Show Help"
                onClick={() => {
                  this.store.dispatch(toggleHelpMessage());
                }}
              />
              <p
                className="toggle-highlight"
                title="Show descriptions for annotations made while playing"
              >Auto Highlight</p>
              <i className="toggle-highlight fa fa-check-square-o"></i>
            </div>
            <div className="create-annotation"></div>
            <HelpMessage visibility={state.helpMessageShown} />
            <Annotations insertEditor={this.insertEditor} />
          </div>
        </div>
      </div>
    );
  }
}

VideoAnnotation.contextTypes = {
  store: React.PropTypes.object,
};

export default VideoAnnotation;
