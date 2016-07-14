import React from 'react';

import AnnotationItem from '../AnnotationItem/AnnotationItem';
import Utils from '../../utils';

import './Annotations.less';

class Annotations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
    };

    this.videoTag = Utils.getVideoInterface();

    this.onItemEdit = this.onItemEdit.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  componentDidMount() {
    // listen on time updates from the video playback time
    this.videoTag.player.ontimeupdate = this.handleTimeUpdate;
  }

  onItemEdit(annotationItem) {
    return (e) => {
      e.preventDefault();
      this.props.insertEditor(annotationItem);
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
    const props = this.props;
    const hasSearchQuery = (text, query) =>
      text.toLowerCase().indexOf(query) > -1;
    const setTimes = (annotation, index, list) => {
      const nextStart = index < list.length - 1 ?
                        list[index + 1].start_seconds :
                        annotation.end_seconds;
      return Object.assign({}, annotation, { nextStart });
    };
    const stateToComponent = (note) =>
      <AnnotationItem
        data={note}
        currentTime={this.state.currentTime}
        autoHighlight={props.autoHighlight}
        key={note.id}
        handleItemDelete={props.deleteItem(note.id)}
        handleItemEdit={this.onItemEdit(note)}
        handleSeek={this.onSeek(note.start_seconds)}
      />;
    
    const filteredAnnotations = props
      .notes.filter((note) =>
        hasSearchQuery(
          note.annotation,
          props.searchQuery
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

Annotations.propTypes = {
  notes: React.PropTypes.array,
  searchQuery: React.PropTypes.string,
  autoHighlight: React.PropTypes.bool,
  
  insertEditor: React.PropTypes.func,
  deleteItem: React.PropTypes.func,
};

export default Annotations;
