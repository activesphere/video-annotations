import React from 'react';
import AnnotationItem from '../AnnotationItem/AnnotationItem';

class Annotations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
    };
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  componentDidMount() {
    this.props.videoTag.player.ontimeupdate = this.handleTimeUpdate;
  }

  handleTimeUpdate() {
    this.setState({
      currentTime: this.props.videoTag.player.currentTime,
    });
  }

  render() {
    const hasSearchQuery = (text, query) =>
      text.toLowerCase().indexOf(query) > -1;

    const filteredAnnotations = this.props
      .annotations.filter((annotation) =>
        hasSearchQuery(
          annotation.annotation,
          this.props.searchQuery
        )
      ).map((annotation, index) =>
        <AnnotationItem
          data={annotation}
          currentTime={this.state.currentTime}
          key={index}
          index={index}
          handleItemDelete={this.props.handleItemDelete}
          handleItemEdit={this.props.handleItemEdit}
          handleSeek={this.props.handleSeek}
        />
      );
    
    return (
      <ul className="annotations">
        {filteredAnnotations}
      </ul>
    );
  }
}

Annotations.propTypes = {
  annotations: React.PropTypes.array,
  searchQuery: React.PropTypes.string,
  videoTag: React.PropTypes.object,
  handleItemDelete: React.PropTypes.func,
  handleItemEdit: React.PropTypes.func,
  handleSeek: React.PropTypes.func,
};

export default Annotations;
