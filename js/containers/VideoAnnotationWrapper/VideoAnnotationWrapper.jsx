import VideoAnnotation from '../../components/VideoAnnotation/VideoAnnotation';

import { connect } from 'react-redux';

import { changeSearchQuery, toggleHelpMessage,
         editAnnotation, addAnnotation } from '../../actions';


const mapStateToProps = state => ({
  searchQuery: state.searchQuery,
  helpMessageShown: state.helpMessageShown,
});

const mapDispatchToProps = dispatch => ({
  handleSearchBoxChange: (e) => {
    dispatch(changeSearchQuery(e.target.value.toLowerCase()));
  },
  
  toggleHelpShown: () => {
    dispatch(toggleHelpMessage());
  },
  
  createAnnotation: (
    start_seconds,
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
        start_seconds,
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
