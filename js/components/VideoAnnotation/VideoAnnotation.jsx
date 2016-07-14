import React from 'react';
import ReactDOM from 'react-dom';

import SearchBox from '../SearchBox/SearchBox';
import Editor from '../Editor/Editor';

import HelpMessage from '../HelpMessage/HelpMessage';
import UserInfo from '../UserInfo/UserInfo';
import Summary from '../../containers/Summary/Summary';

import AnnotationsWrapper from '../../containers/AnnotationsWrapper/AnnotationsWrapper';

import Utils from '../../utils';

import './VideoAnnotation.less';


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
    document.onkeydown = this.onKeyDown;
  }

  onKeyDown(e) {
    if (e.altKey && e.key === 'd') {
      // bring up the editor to create a new annotation.
      e.preventDefault();
      this.insertEditor();
    } else if (e.shiftKey && e.key === 'S') {
      // wants to share!
      this.showSummary();
    }
  }

  onAnnotationCreate(start_seconds, text, editId) {
    const currentVideoTime = this.videoTag.currentTime;
    this.props.createAnnotation(
      start_seconds,
      text,
      editId,
      currentVideoTime
    );
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

  showSummary() {
    const summaryBox = document.querySelector('.summary-table-wrapper');
    if (summaryBox) {
      // summary box already exists; remove it
      ReactDOM.unmountComponentAtNode(
        document.querySelector('.summary-page')
      );
      this.videoTag.play();
    } else {
      ReactDOM.render(
        <Summary />,
        document.querySelector('.summary-page')
      );
      this.videoTag.pause();
    }
  }
  
  render() {
    const props = this.props;
    return (
      <div id="video-annotation">
        <div className="sidebar sidebar-visible">
          <div className="annotations-list">
            <UserInfo />
            <SearchBox
              handleSearchBoxChange={props.handleSearchBoxChange}
              searchQuery={props.searchQuery}
            />
            <div className="fa-container">
              <i
                className="fa fa-question toggle-info"
                title="Show Help"
                onClick={props.toggleHelpShown}
              />
              <p
                className="toggle-highlight"
                title="Show descriptions for annotations made while playing"
              >Auto Highlight</p>
              <i className="toggle-highlight fa fa-check-square-o"></i>
            </div>
            <div className="create-annotation"></div>
            <HelpMessage visibility={props.helpMessageShown} />
            <AnnotationsWrapper insertEditor={this.insertEditor} />
          </div>
        </div>
      </div>
    );
  }
}

VideoAnnotation.propTypes = {
  searchQuery: React.PropTypes.string,
  helpMessageShown: React.PropTypes.bool,

  handleSearchBoxChange: React.PropTypes.func,
  toggleHelpShown: React.PropTypes.func,
  createAnnotation: React.PropTypes.func,
};

export default VideoAnnotation;
