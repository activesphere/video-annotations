import React from 'react';

class AnnotationItem extends React.Component {
  constructor() {
    super();
    this.state = {
      expanded: false,
    };
    this.toggleExpanded = this.toggleExpanded.bind(this);
  }

  toggleExpanded() {
    console.log('im here n imma dance');
    this.setState({
      expanded: !this.state.expanded,
    });
  }

  render() {
    const data = this.props.data;
    const now = this.props.currentTime;

    let arrowDirection = 'icon-title fa fa-caret-right';
    let display = 'none';
    if ((now >= data.start_seconds && now <= data.nextStart) ||
        this.state.expanded) {
      arrowDirection = 'icon-title fa fa-caret-down';
      display = 'block';
    }
    
    return (
      <li className="video-annotation">
        <div className="annotation-detail">
          <span
            className={arrowDirection}
            data-type="auto"
            onClick={this.toggleExpanded}
          ></span>
          <a href="#" className="seek" onClick={this.props.handleSeek}>
            <p className="annotation-title">{data.title}</p>
          </a>
          <span className="label quick">{data.start_minutes}</span>
          <a
            href="#"
            className="delete fa fa-trash"
            title="Delete"
            onClick={this.props.handleItemDelete}
          ></a>
          <a
            href="#"
            className="edit fa fa-pencil"
            title="Edit"
            onClick={this.props.handleItemEdit}
          ></a>
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
  currentTime: React.PropTypes.Number,
  handleItemDelete: React.PropTypes.func,
  handleItemEdit: React.PropTypes.func,
  handleSeek: React.PropTypes.func,
};

export default AnnotationItem;
