import secondsToHhmmss from '../utils/secondsToHhmmsss';
import EditorSchema, { ImageNodeType } from './Schema';
import { startTimeMark, endTimeMark } from './timemarker';

import { toggleMark, wrapIn } from 'prosemirror-commands';
import { findTextNodes, findParentNode, findChildren } from 'prosemirror-utils';
import { EditorState, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';

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

export const insertImageForTime = (e: any, videoTime: number, view: EditorView) => {
  const { data } = e;
  const { dataURL: src, width, height } = data;

  const { state } = view;

  const { $from } = state.selection;
  const index = $from.index();

  if (!$from.parent.canReplaceWith(index, index, ImageNodeType)) {
    return;
  }

  const newState = state.apply(
    state.tr.replaceSelectionWith(
      ImageNodeType.create({
        src,
        width,
        height,
        data: {
          maxWidth: width, // max width is initial width
          ts: floorOrZero(videoTime),
        },
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

const getTextFromSelection = (state: EditorState) => {
  const { selection } = state;

  if (selection.empty) {
    return '';
  }

  const fragment = state.doc.cut(selection.from, selection.to);
  const textNodes = findTextNodes(fragment);

  const text = textNodes.reduce((acc, { node }) => acc + node.text, '');

  return text;
};

function findTimeRange(selection: Selection) {
  const { $from, $to } = selection;

  if (!$from.parent.eq($to.parent)) {
    console.log('findTimeRange - not same parent');
  }
}

// Regex can match ':20' instead of just '20'.
const parseTimeUnit = (s: string) => parseFloat(s[0] === ':' ? s.substring(1, s.length) : s);

function secondsFromTimeMark(match: any) {
  let secs = 0;
  console.log('match =', match);
  if (match[4] !== undefined) {
    console.log('match[4] !== undefined');
    secs += parseTimeUnit(match[4]);
    secs += parseTimeUnit(match[3]) * 60;
    secs += parseTimeUnit(match[1]) * 3600;
    console.log('secs =', secs);
  } else if (match[3] !== undefined) {
    secs += parseTimeUnit(match[3]);
    secs += parseTimeUnit(match[1]) * 60;
  } else {
    if (match[1] === undefined) {
      console.warn('Unexpected time mark -', match[0]);
      return 0;
    }
    secs = parseTimeUnit(match[1]);
  }
  return secs;
}

// A command that unwraps all time_block nodes in current selection
export const unwrapAllTimeBlocks = (state: EditorState, dispatch: any) => {
  console.log('UnwrapAllTimeBlocks');

  const { selection } = state;
  const { $from, $to } = selection;

  const nodeRange = $from.blockRange($to);

  const containerNode = nodeRange!.$from.node();

  const startOffset = nodeRange!.$from.parentOffset;
  const startChild = containerNode!.child(startOffset);

  console.log('startChild =', startChild);

  return true;
};

export const mkWrapInTimeBlock = (videoDuration: number) => (state: EditorState, dispatch: any) => {
  console.log('WrapInTimeBlock');

  const { selection } = state;

  const predicate = (node: Node) => node.type !== EditorSchema.nodes.time_block;
  const parent = findParentNode(predicate)(selection);

  console.log('parent =', parent);
  console.log('Block range');

  const { $from, $to } = selection;

  const nodeRange = $from.blockRange($to);

  if (!nodeRange) {
    return true;
  }

  const { $from: rangeFrom, $to: rangeTo } = nodeRange;

  console.log('nodeRange.from node =', rangeFrom.node());
  console.log('nodeRange.to node =', rangeTo.node());
  console.log('Text in selection =', getTextFromSelection(state));

  // Search for time start and end marker
  {
    const text = getTextFromSelection(state);

    const startTimeMatch = text.match(startTimeMark);
    if (!startTimeMatch) {
      return true;
    }

    const endTimeMatch = text.match(endTimeMark);
    if (!endTimeMatch) {
      return true;
    }

    // Check they do form a proper block

    if (startTimeMatch.index! >= endTimeMatch.index!) {
      return true;
    }

    const startTime = secondsFromTimeMark(startTimeMatch);
    const endTime = secondsFromTimeMark(endTimeMatch);

    console.log('startTime =', startTime, 'endTime =', endTime, 'videoDuration =', videoDuration);

    // Wrap in time_block
    return wrapIn(EditorSchema.nodes.time_block, {
      startTime,
      endTime,
      videoDuration,
    })(state, dispatch);
  }

  return true;
};
