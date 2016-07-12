export const ADD_ANNOTATION = 'ADD_ANNOTATION';
export const DELETE_ANNOTATION = 'DELETE_ANNOTATION';
export const EDIT_ANNOTATION = 'EDIT_ANNOTATION';
export const RECEIVE_INITIAL_STATE = 'RECEIVE_INITIAL_STATE';
export const CHANGE_SEARCH_QUERY = 'CHANGE_SEARCH_QUERY';
export const TOGGLE_HELP_MESSAGE = 'TOGGLE_HELP_MESSAGE';


export const receiveInitialState = (state) => {
  return {
    type: RECEIVE_INITIAL_STATE,
    state: {
      ...state,
      notes: state.annotations,
    },
  };
}

export const addAnnotation =
(text, metadata, start_seconds, currentVideoTime) => {
  return {
    type: ADD_ANNOTATION,
    timeNow: new Date().toString(),
    id: Date.now(),
    text,
    metadata,
    start_seconds,
    currentVideoTime,
  }
}

export const deleteAnnotation = (id) => {
  return {
    type: DELETE_ANNOTATION,
    id,
  }
}

export const editAnnotation =
(id, text, metadata) => {
  return {
    type: EDIT_ANNOTATION,
    timeNow: new Date().toString(),
    id,
    text,
    metadata,
  }
}

export const changeSearchQuery = (text) => {
  return {
    type: CHANGE_SEARCH_QUERY,
    query: text,
  }
}

export const toggleHelpMessage = () => {
  return {
    type: TOGGLE_HELP_MESSAGE,
  }
}
