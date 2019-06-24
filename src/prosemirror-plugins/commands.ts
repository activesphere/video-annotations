import AppConfig from '../AppConfig';
import secondsToHhmmss from '../utils/secondsToHhmmsss';
import EditorSchema, { ImageNodeType } from './Schema';

import { toggleMark } from 'prosemirror-commands';
import { findTextNodes } from 'prosemirror-utils';

const floorOrZero = (n: number) => (Number.isNaN(n) ? 0 : Math.floor(n));

const timestampRegex = /^([0-9]{1,2})[.:]([0-9]{1,2})[.:]([0-9]{1,2})$/;

type State = any;

// Helper function to get the underlying timestamp value from current selection, if one exists in
// the selection.
function getTimestampValueUnderCursor(state: State) {
  const { selection } = state;

  const { $from, $to } = selection;
  const marks = [...$from.marks(), ...$to.marks()];

  const times = [];

  for (const mark of marks) {
    if (mark.type.name === 'timestamp') {
      times.push(mark.attrs.videoTime);
    }
  }

  return {
    haveTimestamp: times.length !== 0,
    videoTime: Math.floor(times[0]),
  };
}

// Returns a command that toggles the selected text to be marked a timestamp.
export function makeCmdToggleTimestampMark(doCommand: (cmd: string) => number) {
  return (state: State, dispatch: any) => {
    const { selection } = state;
    const videoTime = doCommand('currentTime');

    if (selection.empty) {
      return false;
    }

    if (Number.isNaN(videoTime)) {
      return true;
    }

    return toggleMark(EditorSchema.marks.timestamp, {
      videoTime: Math.floor(videoTime),
    })(state, dispatch);
  };
}

// Returns a command that puts the current time in 'hh:mm:ss' format into the editor.
export function makeCmdPutTimestampText(doCommand: (cmd: String) => number) {
  return (state: State, dispatch: any) => {
    const videoTime = doCommand('currentTime');

    if (Number.isNaN(videoTime)) {
      return true;
    }

    // Create text node with the timestamp mark
    const mark = EditorSchema.marks.timestamp.create({
      videoTime,
    });
    const text = EditorSchema.text(secondsToHhmmss(videoTime), [mark]);

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(text, false));
    }

    return true;
  };
}

// Command that converts selected text the form 'hh:mm:ss' into a timestamp.
export const textToTimestamp = (state: State, dispatch: any) => {
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
export function makeCmdTellExtensionToCaptureFrame(
  doCommand: (cmd: string) => any,
  getCurrentVideoInfo: any,
  refEditorView: any
) {
  return {
    cmdTellExtensionToCaptureFrame: () => {
      const { videoId } = getCurrentVideoInfo();
      if (videoId) {
        window.frames[0].postMessage({ type: AppConfig.CaptureCurrentFrameMessage }, '*');
      }
      return true;
    },

    extensionResponseHandler: (e: any) => {
      if (e.data.type !== AppConfig.CaptureCurrentFrameResponse || !refEditorView.current) {
        return;
      }

      const { data } = e;
      const { dataURL: source, width: origWidth, height: origHeight } = data;

      // Initial width is same as that of original image
      const outerWidth = `${origWidth}px`;

      const view = refEditorView.current;
      const { state } = view;

      const { $from } = state.selection;
      const index = $from.index;

      if (!$from.parent.canReplaceWith(index, index, ImageNodeType)) {
        return;
      }

      const videoTime = floorOrZero(doCommand('currentTime'));

      const newState = state.apply(
        state.tr.replaceSelectionWith(
          ImageNodeType.create({
            source,
            outerWidth,
            videoTime,
            origWidth,
            origHeight,
          })
        )
      );

      view.updateState(newState);
    },
  };
}

export const mkSeekToTimestamp = (doCommand: (cmd: string, params: any) => void) => (
  state: State
) => {
  const { haveTimestamp, videoTime } = getTimestampValueUnderCursor(state);

  if (haveTimestamp) {
    doCommand('seekToTime', { videoTime });
  }

  return true;
};
