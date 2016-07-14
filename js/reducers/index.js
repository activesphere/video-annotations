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
    case RECEIVE_INITIAL_STATE:
      return [ ...action.state.notes ];
      
    case ADD_ANNOTATION:
      const id = action.id;
      const start_seconds = action.start_seconds;
      const end_seconds = action.currentVideoTime;
      const start_minutes = Utils.minuteSeconds(start_seconds);
      const end_minutes = Utils.minuteSeconds(end_seconds);

      const annotationObj = {
        id,
        start_seconds,
        end_seconds,
        start_minutes,
        end_minutes,
        ...Utils.splitAnnotation(action.text),
      }
      
      const currentNotes = [ ...state ];
      const newNotes = currentNotes
        .filter((each) =>
          each.start_seconds <= start_seconds
        )
        .concat([ annotationObj ])
        .concat(currentNotes.filter((each) =>
          each.start_seconds > start_seconds
        ));
      
      return newNotes;

    case DELETE_ANNOTATION:
      return state.filter((each) => each.id !== action.id);

    case EDIT_ANNOTATION:
      return state
        .map((each) => {
          if(each.id !== action.id) return each;
          return {
            ...each,
            ...Utils.splitAnnotation(action.text)
          }
        });

    default:
      return state;
  }
}

const metadata = (state = initialMetadata, action) => {
  switch (action.type) {
    case RECEIVE_INITIAL_STATE:
      return { ...action.state.metadata };
      
    case ADD_ANNOTATION:
      const creationTime = state.creationTime ?
                           state.creationTime :
                           action.timeNow;
      const lastUpdate = action.timeNow;
      return {
        ...state,
        creationTime,
        lastUpdate,
      };

    case EDIT_ANNOTATION:
      return {
        ...state,
        lastUpdate: action.timeNow,
      };

    default:
      return state;
  }
}

const searchQuery = (state = '', action) => {
  switch (action.type) {
    case CHANGE_SEARCH_QUERY:
      return action.query;
    default:
      return state;
  }
}

const helpMessageShown = (state = false, action) => {
  switch (action.type) {
    case TOGGLE_HELP_MESSAGE:
      return !state;
    default:
      return state;
  }
}

const autoHighlight = (state = true, action) => {
  switch (action.type) {
    case TOGGLE_AUTOHIGHLIGHT:
      return !state;
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  notes,
  metadata,
  searchQuery,
  helpMessageShown,
  autoHighlight,
});

export default rootReducer;
