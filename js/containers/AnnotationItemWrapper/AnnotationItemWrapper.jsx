import React from 'react';
import AnnotationItem from '../../components/AnnotationItem/AnnotationItem';

class AnnotationItemWrapper extends React.Component {
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

  render() {
    const props = this.props;
    const expandLogic = {
      expanded: this.state.expanded,
      currentTime: this.props.currentTime,
    };
    
    return (
      <AnnotationItem
        data={props.data}
        expandLogic={expandLogic}
        handleItemDelete={props.handleItemDelete}
        handleItemEdit={props.handleItemEdit}
        handleSeek={props.handleSeek}
        toggleExpanded={this.toggleExpanded}
      />
    );
  }
}

AnnotationItemWrapper.propTypes = {
  data: React.PropTypes.object,
  currentTime: React.PropTypes.number,
  handleItemDelete: React.PropTypes.func,
  handleItemEdit: React.PropTypes.func,
  handleSeek: React.PropTypes.func,
};

export default AnnotationItemWrapper;
