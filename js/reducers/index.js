import {
  RECEIVE_INITIAL_STATE,
  ADD_ANNOTATION, EDIT_ANNOTATION, DELETE_ANNOTATION,
  CHANGE_SEARCH_QUERY, TOGGLE_HELP_MESSAGE, TOGGLE_AUTOHIGHLIGHT,
} from '../actions/index';

import Utils from '../utils';

import { combineReducers } from 'redux';


const initialMetadata = {
  videoTitle: '',
  provider: '',
  creationTime: null,
  lastUpdate: null,
};

const notes = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_INITIAL_STATE: {
      return [...action.state.notes];
    }

    case ADD_ANNOTATION: {
      const id = action.id;
      const startSeconds = action.startSeconds;
      const endSeconds = action.currentVideoTime;
      const startMinutes = Utils.minuteSeconds(startSeconds);
      const endMinutes = Utils.minuteSeconds(endSeconds);
      const splitAnnotationText = Utils.splitAnnotation(action.text);

      const annotationObj = {
        id,
        startSeconds,
        endSeconds,
        startMinutes,
        endMinutes,
        ...splitAnnotationText,
      };

      const currentNotes = [...state];
      const newNotes = currentNotes
        .filter((each) =>
          each.startSeconds <= startSeconds
        )
        .concat([annotationObj])
        .concat(currentNotes.filter((each) =>
          each.startSeconds > startSeconds
        ));

      return newNotes;
    }

    case DELETE_ANNOTATION:
      return state.filter((each) => each.id !== action.id);

    case EDIT_ANNOTATION:
      return state
        .map((each) => {
          if (each.id !== action.id) return each;
          return {
            ...each,
            ...Utils.splitAnnotation(action.text),
          };
        });

    default:
      return state;
  }
};

const metadata = (state = initialMetadata, action) => {
  switch (action.type) {
    case RECEIVE_INITIAL_STATE:
      return { ...action.state.metadata };

    case ADD_ANNOTATION: {
      const creationTime = state.creationTime ?
                           state.creationTime :
                           action.timeNow;
      const lastUpdate = action.timeNow;
      return {
        ...state,
        creationTime,
        lastUpdate,
      };
    }

    case EDIT_ANNOTATION:
      return {
        ...state,
        lastUpdate: action.timeNow,
      };

    default:
      return state;
  }
};

const searchQuery = (state = '', action) => {
  switch (action.type) {
    case CHANGE_SEARCH_QUERY:
      return action.query;
    default:
      return state;
  }
};

const helpMessageShown = (state = false, action) => {
  switch (action.type) {
    case TOGGLE_HELP_MESSAGE:
      return !state;
    default:
      return state;
  }
};

const autoHighlight = (state = true, action) => {
  switch (action.type) {
    case TOGGLE_AUTOHIGHLIGHT:
      return !state;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  notes,
  metadata,
  searchQuery,
  helpMessageShown,
  autoHighlight,
});

export default rootReducer;
