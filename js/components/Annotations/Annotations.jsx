import React from 'react';

import AnnotationItemWrapper from '../../containers/AnnotationItemWrapper/AnnotationItemWrapper';
import Utils from '../../utils';

import './Annotations.less';

import { deleteAnnotation } from '../../actions';

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
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  componentDidMount() {
    this.store = this.context.store;
    this.unsubscribe = this.store.subscribe(() => this.forceUpdate());
    // listen on time updates from the video playback time
    this.videoTag.player.ontimeupdate = this.handleTimeUpdate;
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
    return (e) => {
      e.preventDefault();
      this.videoTag.setCurrentTime(toTime);
    };
  }

  handleTimeUpdate() {
    const currentTime = this.videoTag.player.currentTime;
    this.setState({ currentTime });
  }

  render() {
    this.store = this.context.store;
    const state = this.store.getState();
    
    const hasSearchQuery = (text, query) =>
      text.toLowerCase().indexOf(query) > -1;
    const setTimes = (annotation, index, list) => {
      const nextStart = index < list.length - 1 ?
                        list[index + 1].start_seconds :
                        annotation.end_seconds;
      return Object.assign({}, annotation, { nextStart });
    };
    const stateToComponent = (note) =>
      <AnnotationItemWrapper
        data={note}
        currentTime={this.state.currentTime}
        key={note.id}
        handleItemDelete={this.onItemDelete(note.id)}
        handleItemEdit={this.onItemEdit(note.id)}
        handleSeek={this.onSeek(note.start_seconds)}
      />;
    
    const filteredAnnotations = state
      .notes.filter((note) =>
        hasSearchQuery(
          note.annotation,
          state.searchQuery
        )
      )
      .map(setTimes)
      .map(stateToComponent);
    
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
