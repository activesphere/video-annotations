import React from 'react';
import ReactDOM from 'react-dom';

import AnnotationItem from '../AnnotationItem/AnnotationItem';
import Editor from '../Editor/Editor';
import Utils from '../../utils';

import './Annotations.less';

import { addAnnotation, deleteAnnotation,
         editAnnotation, setMetadata } from '../../actions';

class Annotations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
    };

    this.videoTag = Utils.getVideoInterface();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onAnnotationCreate = this.onAnnotationCreate.bind(this);
    this.removeEditor = this.removeEditor.bind(this);
    this.onItemDelete = this.onItemDelete.bind(this);
    this.onItemEdit = this.onItemEdit.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.insertEditor = this.insertEditor.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
  }

  componentDidMount() {
    this.store = this.context.store;
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

  onItemDelete(id) {
    return () => {
      this.store.dispatch(deleteAnnotation(id));
    };
  }

  onItemEdit(id) {
    return () => {
      const state = this.store.getState();
      const targetAnnotation = state
        .notes.find((note) => note.id === id);
      this.insertEditor(targetAnnotation);
    };
  }

  onSeek(toTime) {
    this.videoTag.setCurrentTime(toTime);
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

  updateMetadata() {
    const host = Utils.hosts[window.location.hostname];
    const pagedata = Utils.getVideoInfo(host);
    this.store.dispatch(setMetadata(pagedata));
  }

  render() {
    this.store = this.context.store;
    const state = this.store.getState();
    
    const hasSearchQuery = (text, query) =>
      text.toLowerCase().indexOf(query) > -1;
    const filteredAnnotations = state
      .notes.filter((note) =>
        hasSearchQuery(
          note.annotation,
          state.searchQuery
        )
      ).map((note) =>
        <AnnotationItem
          data={note}
          key={note.id}
          handleItemDelete={this.onItemDelete(note.id)}
          handleItemEdit={this.onItemEdit(note.id)}
          handleSeek={this.onSeek}
        />
      );
    
    return (
      <ul className="annotations">
        {filteredAnnotations}
      </ul>
    );
  }
}

Annotations.contextTypes = {
  store: React.PropTypes.object,
};

export default Annotations;
