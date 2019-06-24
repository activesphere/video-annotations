import secondsToHhmmss from '../utils/secondsToHhmmsss';
import EditorSchema, { ImageNodeType } from './Schema';

import { toggleMark } from 'prosemirror-commands';
import { findTextNodes } from 'prosemirror-utils';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

const floorOrZero = (n: number) => (Number.isNaN(n) ? 0 : Math.floor(n));

const timestampRegex = /^([0-9]{1,2})[.:]([0-9]{1,2})[.:]([0-9]{1,2})$/;

type State = any;

// Helper function to get the underlying timestamp value from current selection, if one exists in
// the selection.
function timestampUnderCursor(state: EditorState) {
  const { selection } = state;
  const { $from, $to } = selection;
  const marks = [...$from.marks(), ...$to.marks()];

  const times = marks.filter(m => m.type.name === 'timestamp').map(m => m.attrs.videoTime);

  return {
    haveTimestamp: times.length !== 0,
    videoTime: Math.floor(times[0]),
  };
}

type GetVideoTime = () => number;

// Returns a command that toggles the selected text to be marked a timestamp.
export function mkToggleTimestampMark(videoTimestamp: () => number) {
  return (state: State, dispatch: any) => {
    const { selection } = state;
    const videoTime = videoTimestamp();

    if (selection.empty) return false;

    if (Number.isNaN(videoTime)) return true;

    return toggleMark(EditorSchema.marks.timestamp, {
      videoTime: Math.floor(videoTime),
    })(state, dispatch);
  };
}

// Puts the current time in 'hh:mm:ss' format into the editor.
export const mkInsertTimestampStr = (getVideoTime: GetVideoTime) => (
  state: EditorState,
  dispatch: any
) => {
  const videoTime = getVideoTime();
  if (Number.isNaN(videoTime)) return true;

  // Create text node with the timestamp mark
  const mark = EditorSchema.marks.timestamp.create({ videoTime });
  const text = EditorSchema.text(secondsToHhmmss(videoTime), [mark]);

  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(text, false));
  }

  return true;
};

// Command that converts selected text the form 'hh:mm:ss' into a timestamp.
export const textToTimestamp = (state: EditorState, dispatch: any) => {
  const { selection } = state;

  if (selection.empty) return true;

  const fragment = state.doc.cut(selection.from, selection.to);
  const textNodes = findTextNodes(fragment);

  if (textNodes.length !== 1) return true;

  const text = textNodes[0].node.text;
  if (!text) return true;

  const match = text.trim().match(timestampRegex);
  if (!match) return true;

  const videoTime = parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);

  const mark = EditorSchema.marks.timestamp.create({ videoTime });
  const textNode = EditorSchema.text(secondsToHhmmss(videoTime), [mark]);

  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(textNode, false));
  }

  return true;
};

// Returns an editor command that simply tells the extension to capture the current frame. Does not
// apply any transaction to the state. Also returns a function that handles the response from the
// extension.
export const insertImageForTime = (e: any, videoTime: number, view: EditorView) => {
  const { data } = e;
  const { dataURL: source, width: origWidth, height: origHeight } = data;

  // Initial width is same as that of original image
  const outerWidth = `${origWidth}px`;

  const { state } = view;

  const { $from } = state.selection;
  const index = $from.index();

  if (!$from.parent.canReplaceWith(index, index, ImageNodeType)) {
    return;
  }

  const newState = state.apply(
    state.tr.replaceSelectionWith(
      ImageNodeType.create({
        source,
        outerWidth,
        videoTime: floorOrZero(videoTime),
        origWidth,
        origHeight,
      })
    )
  );

  view.updateState(newState);
};

export const mkSeekToTimestamp = (seekTo: (ts: number) => void) => (state: EditorState) => {
  const { haveTimestamp, videoTime } = timestampUnderCursor(state);

  if (haveTimestamp) {
    seekTo(videoTime);
  }

  return true;
};
