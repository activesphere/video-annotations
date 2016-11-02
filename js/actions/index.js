export const ADD_ANNOTATION = 'ADD_ANNOTATION';
export const DELETE_ANNOTATION = 'DELETE_ANNOTATION';
export const EDIT_ANNOTATION = 'EDIT_ANNOTATION';
export const RECEIVE_INITIAL_STATE = 'RECEIVE_INITIAL_STATE';
export const CHANGE_SEARCH_QUERY = 'CHANGE_SEARCH_QUERY';
export const TOGGLE_HELP_MESSAGE = 'TOGGLE_HELP_MESSAGE';
export const TOGGLE_AUTOHIGHLIGHT = 'TOGGLE_AUTOHIGHLIGHT';


export const receiveInitialState = state => ({
  type: RECEIVE_INITIAL_STATE,
  state: {
    ...state,
    notes: state.annotations,
  },
});

export const addAnnotation =
(text, startSeconds, currentVideoTime) => ({
  type: ADD_ANNOTATION,
  timeNow: new Date().toString(),
  id: Date.now(),
  text,
  startSeconds,
  currentVideoTime,
});

export const deleteAnnotation = id => ({
  type: DELETE_ANNOTATION,
  id,
});

export const editAnnotation = (id, text) => ({
  type: EDIT_ANNOTATION,
  timeNow: new Date().toString(),
  id,
  text,
});

export const changeSearchQuery = (text) => ({
  type: CHANGE_SEARCH_QUERY,
  query: text,
});

export const toggleHelpMessage = () => ({
  type: TOGGLE_HELP_MESSAGE,
});

export const toggleAutoHighlight = () => ({
  type: TOGGLE_AUTOHIGHLIGHT,
});
