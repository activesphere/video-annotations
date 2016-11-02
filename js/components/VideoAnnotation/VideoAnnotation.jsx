import React from 'react';
import ReactDOM from 'react-dom';

import SearchBox from '../SearchBox/SearchBox';
import Editor from '../Editor/Editor';

import HelpMessage from '../HelpMessage/HelpMessage';
import UserInfo from '../UserInfo/UserInfo';
import Summary from '../../containers/Summary/Summary';

import AnnotationsWrapper from '../../containers/AnnotationsWrapper/AnnotationsWrapper';

import AnnotationsVisual from '../AnnotationsVisual/AnnotationsVisual';

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

    this.toggleVisualization = this.toggleVisualization.bind(this);
    this.removeVisualization = this.removeVisualization.bind(this);
  }

  componentDidMount() {
    document.onkeydown = this.onKeyDown;

    const $video = Utils.getVideoInterface();
    $video.append('<div id="visualizations" />');
  }

  onKeyDown(e) {
    if (e.altKey && e.which === 68) { // 'd'
      // bring up the editor to create a new annotation.
      e.preventDefault();
      this.insertEditor();
    } else if (e.shiftKey && e.which === 83) { // 's'
      // wants to share!
      this.toggleSummary();
    } else if (e.altKey && e.which === 86) { // 'v'
      this.toggleVisualization();
    } else if (e.altKey && e.which === 72) { // 'h'
      this.props.toggleHelpShown();
    }
  }

  onAnnotationCreate(startSeconds, text, editId) {
    const currentVideoTime = this.videoTag.currentTime;
    this.props.createAnnotation(
      startSeconds,
      text,
      editId,
      currentVideoTime
    );
    // remove editor
    this.removeEditor();
  }

  insertEditor(annotation = null) {
    const startSeconds = annotation ?
                          annotation.startSeconds :
                          Number(this.videoTag.getCurrentTime());
    this.videoTag.pause();
    ReactDOM.render(
      <Editor
        handleAnnotationCreate={this.onAnnotationCreate}
        handleAnnotationCancel={this.removeEditor}
        annotation={annotation}
        startSeconds={startSeconds}
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

  toggleSummary() {
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

  toggleVisualization() {
    const alreadyExists = document.querySelector('.theVisualStuff');
    if (alreadyExists) {
      this.removeVisualization();
    } else {
      ReactDOM.render(
        <AnnotationsVisual
          notes={this.props.notes}
          onRemove={this.removeVisualization}
        />,
        document.getElementById('visualizations')
      );
    }
  }

  removeVisualization() {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('visualizations')
    );
  }

  render() {
    const props = this.props;
    let autoHighlightClass = props.autoHighlight ?
                             'toggle-highlight fa fa-check-square-o' :
                             'toggle-highlight fa fa-square-o';
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
              <i
                className={autoHighlightClass}
                onClick={props.toggleAutoHighlight}
              />
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
  autoHighlight: React.PropTypes.bool,
  notes: React.PropTypes.array,

  handleSearchBoxChange: React.PropTypes.func,
  toggleHelpShown: React.PropTypes.func,
  toggleAutoHighlight: React.PropTypes.func,
  createAnnotation: React.PropTypes.func,
};

export default VideoAnnotation;
