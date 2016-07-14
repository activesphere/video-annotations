import React from 'react';
import { connect } from 'react-redux';

import Annotations from '../../components/Annotations/Annotations';
import { deleteAnnotation } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  notes: state.notes,
  searchQuery: state.searchQuery,
  autoHighlight: state.autoHighlight,
  insertEditor: ownProps.insertEditor,
});

const mapDispatchToProps = (dispatch) => ({
  deleteItem: (id) => (e) => {
    e.preventDefault();
    dispatch(deleteAnnotation(id));
  },
});

const AnnotationsWrapper = connect(
  mapStateToProps,
  mapDispatchToProps
)(Annotations);


AnnotationsWrapper.propTypes = {
  insertEditor: React.PropTypes.func,
};

export default AnnotationsWrapper;
