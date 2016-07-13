import React from 'react';

const AnnotationItem = (props) => {
  const data = props.data;
  const expandLogic = props.expandLogic;
  const now = expandLogic.currentTime;

  let arrowDirection = 'icon-title fa fa-caret-right';
  let display = 'none';
  if ((now >= data.start_seconds && now <= data.nextStart) ||
      expandLogic.expanded) {
    arrowDirection = 'icon-title fa fa-caret-down';
    display = 'block';
  }
  
  return (
    <li className="video-annotation">
      <div className="annotation-detail">
        <span
          className={arrowDirection}
          data-type="auto"
          onClick={props.toggleExpanded}
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
        <p>{data.description}</p>
      </div>
      <div className="edit-annotation"></div>
    </li>
  );
};

AnnotationItem.propTypes = {
  data: React.PropTypes.object,
  expandLogic: React.PropTypes.object,
  handleItemDelete: React.PropTypes.func,
  handleItemEdit: React.PropTypes.func,
  handleSeek: React.PropTypes.func,
  toggleExpanded: React.PropTypes.func,
};

export default AnnotationItem;
