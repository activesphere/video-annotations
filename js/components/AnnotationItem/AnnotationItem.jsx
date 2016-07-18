import React from 'react';
import marked from 'marked';

class AnnotationItem extends React.Component {
  constructor() {
    super();
    this.state = {
      expanded: false,
    };
    this.toggleExpanded = this.toggleExpanded.bind(this);
  }

  toggleExpanded() {
    this.setState({
      expanded: !this.state.expanded,
    });
  }

  rawMarkup(mdText) {
    return {
      __html: marked(mdText),
    };
  }

  render() {
    const props = this.props;
    const data = props.data;

    const expanded = this.state.expanded;
    const now = props.currentTime;

    let arrowDirection = 'icon-title fa fa-caret-right';
    let display = 'none';
    if ((now >= data.start_seconds &&
         now <= data.nextStart &&
         props.autoHighlight) ||
        expanded) {
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
          <a href="#" className="seek" onClick={props.handleSeek}>
            <p className="annotation-title">{data.title}</p>
          </a>
          <span className="label quick">{data.start_minutes}</span>
          <a
            href="#"
            className="delete fa fa-trash"
            title="Delete"
            onClick={props.handleItemDelete}
          ></a>
          <a
            href="#"
            className="edit fa fa-pencil"
            title="Edit"
            onClick={props.handleItemEdit}
          ></a>
        </div>
        <div className="clear"></div>
        <div className="annotation-description" style={{ display }}>
          <p dangerouslySetInnerHTML={this.rawMarkup(data.description)} />
        </div>
        <div className="edit-annotation"></div>
      </li>
    );
  }
}

AnnotationItem.propTypes = {
  data: React.PropTypes.object,
  currentTime: React.PropTypes.number,
  
  handleItemDelete: React.PropTypes.func,
  handleItemEdit: React.PropTypes.func,
  handleSeek: React.PropTypes.func,
};

export default AnnotationItem;
