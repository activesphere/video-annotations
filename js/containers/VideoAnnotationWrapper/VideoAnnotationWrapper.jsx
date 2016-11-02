import VideoAnnotation from '../../components/VideoAnnotation/VideoAnnotation';

import { connect } from 'react-redux';

import { changeSearchQuery, toggleHelpMessage,
         editAnnotation, addAnnotation,
         toggleAutoHighlight } from '../../actions';


const mapStateToProps = state => ({
  searchQuery: state.searchQuery,
  helpMessageShown: state.helpMessageShown,
  autoHighlight: state.autoHighlight,

  notes: state.notes,
});

const mapDispatchToProps = dispatch => ({
  handleSearchBoxChange: (e) => {
    dispatch(changeSearchQuery(e.target.value.toLowerCase()));
  },

  toggleHelpShown: () => {
    dispatch(toggleHelpMessage());
  },

  toggleAutoHighlight: () => {
    dispatch(toggleAutoHighlight());
  },

  createAnnotation: (
    startSeconds,
    text,
    editId,
    currentVideoTime) => {
    if (editId) {
      // this is to edit, not to create
      dispatch(editAnnotation(
        editId,
        text
      ));
    } else {
      // creating a new note
      dispatch(addAnnotation(
        text,
        startSeconds,
        currentVideoTime
      ));
    }
  },
});

const VideoAnnotationWrapper = connect(
  mapStateToProps,
  mapDispatchToProps
)(VideoAnnotation);

export default VideoAnnotationWrapper;
