import React from 'react';

class AnnotationItem extends React.Component {
  constructor(props) {
    super(props);
    const endTime = props.data.end_seconds ?
                    props.data.end_seconds :
                    props.data.start_seconds + 1;
    this.state = {
      descShown: false,
      startTime: props.data.start_seconds,
      endTime,
    };

    this.toggleDescVisibility = this.toggleDescVisibility.bind(this);
    this.onItemDelete = this.onItemDelete.bind(this);
    this.onSeek = this.onSeek.bind(this);
  }

  componentWillReceiveProps(newProps) {
    this.highlight(newProps.currentTime);
  }

  onItemDelete() {
    this.props.handleItemDelete(this.props.index);
  }

  onSeek() {
    this.props.handleSeek(this.state.startTime);
  }

  toggleDescVisibility() {
    this.setState({
      descShown: !this.state.descShown,
    });
  }

  highlight(time) {
    if (time >= this.state.startTime &&
        time <= this.state.endTime) {
      this.setState({ descShown: true });
    } else {
      this.setState({ descShown: false });
    }
  }
  
  render() {
    const data = this.props.data;
    // visibility of the description for this annotation
    const display = this.state.descShown ? 'block' : 'none';
    const arrowDirection = this.state.descShown ?
                           'icon-title fa fa-caret-down' :
                           'icon-title fa fa-caret-right';

    return (
      <li className="video-annotation">
        <div className="annotation-detail">
          <span
            className={arrowDirection}
            data-type="auto"
            onClick={this.toggleDescVisibility}
          ></span>
          <a href="#" className="seek" onClick={this.onSeek}>
            <p className="annotation-title">{data.title}</p>
          </a>
          <span className="label quick">{data.start_minutes}</span>
          <a
            href="#"
            className="delete fa fa-trash"
            title="Delete"
            onClick={this.onItemDelete}
          ></a>
          <a href="#" className="edit fa fa-pencil" title="Edit"></a>
        </div>
        <div className="clear"></div>
        <div className="annotation-description" style={{ display }}>
          <p>{data.description}</p>
        </div>
        <div className="edit-annotation"></div>
      </li>
    );
  }
}

AnnotationItem.propTypes = {
  data: React.PropTypes.object,
  currentTime: React.PropTypes.number,
  index: React.PropTypes.number,
  handleItemDelete: React.PropTypes.func,
  handleSeek: React.PropTypes.func,
};

export default AnnotationItem;
