import React from 'react';

import AnnotationItem from '../AnnotationItem/AnnotationItem';
import Utils from '../../utils';

import './Annotations.less';

import { deleteAnnotation, setMetadata } from '../../actions';

class Annotations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
    };

    this.videoTag = Utils.getVideoInterface();

    this.onItemDelete = this.onItemDelete.bind(this);
    this.onItemEdit = this.onItemEdit.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
  }

  componentDidMount() {
    this.store = this.context.store;
    this.unsubscribe = this.store.subscribe(() => this.forceUpdate());
  }

  componentWillUnmount() { this.unsubscribe(); }

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
      this.props.insertEditor(targetAnnotation);
    };
  }

  onSeek(toTime) {
    this.videoTag.setCurrentTime(toTime);
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

Annotations.propTypes = {
  insertEditor: React.PropTypes.func,
};

export default Annotations;
