import React, { useRef, useEffect, useState } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { toggleMark } from 'prosemirror-commands';
import { DOMParser } from 'prosemirror-model';
import Paper from '@material-ui/core/Paper';
import { makeStyles, createStyles } from '@material-ui/core/styles';

import EditorSchema, { ImageNodeType } from './prosemirror-plugins/Schema';
import ImageNodeView from './prosemirror-plugins/ImageNodeView';
import WithTimeRangeView from './prosemirror-plugins/WithTimeRangeView';
import TimestampImagePlugin, {
  getTimestampValueUnderCursor,
} from './prosemirror-plugins/TimestampImagePlugin';
import AutosavePlugin from './prosemirror-plugins/AutosavePlugin';
import { loadNote } from './LocalStorageHelper';
import { keycodeOfCommandName, commandNameOfKeycode } from './keycodeMap';
import { buildMenuItems } from 'prosemirror-example-setup';
import { wrapInTimeRangeMenuItem } from './prosemirror-plugins/WrapInTimeRange';

import AppConfig from './AppConfig';
import secondsToHhmmss from './utils/secondsToHhmmsss';
import { loadNoteWithId } from './LocalStorageHelper';
import { findTextNodes } from 'prosemirror-utils';

const useStyles = makeStyles(theme =>
  createStyles({
    editor: {
      margin: theme.spacing(2),
    },
  })
);

const floorOrZero = n => (Number.isNaN(n) ? 0 : Math.floor(n));

const EditorComponent = props => {
  const editorView = useRef(null);
  const classes = useStyles();

  const { doCommand, parentApp, videoId, videoTitle } = props;

  const [notes, setNotes] = useState(null);
  const [isLoading, setLoading] = useState(true);

  /* make async call */
  useEffect(() => {
    (async () => {
      const notes = await loadNote(videoId);
      setNotes(notes);
      setLoading(false);
    })();
  }, [videoId, setNotes]);

  useEffect(() => {
    if (!videoId || isLoading || !videoTitle) {
      return;
    }

    const timestemapImagePlugin = new Plugin({
      view: editorView => new TimestampImagePlugin(editorView),
    });

    const autosavePlugin = new Plugin({
      view: editorView => new AutosavePlugin(editorView, videoId),
    });

    // Prosemirror command that toggles the selected text to be marked a timestamp.
    const toggleTimestampMark = (state, dispatch) => {
      const { selection } = state;

      if (selection.empty) {
        return false;
      }

      const videoTime = doCommand('currentTime');

      if (Number.isNaN(videoTime)) {
        return true;
      }

      return toggleMark(EditorSchema.marks.timestamp, {
        videoTime: Math.floor(videoTime),
      })(state, dispatch);
    };

    const timestampRegex = /^([0-9]{1,2})[.:]([0-9]{1,2})[.:]([0-9]{1,2})$/;

    const turnTextToTimestamp = (state, dispatch) => {
      const { selection } = state;

      if (!selection.empty) {
        const fragment = state.doc.cut(selection.from, selection.to);
        const textNodes = findTextNodes(fragment);

        // console.log('Text nodes =', textNodes);

        if (textNodes.length == 1) {
          const text = textNodes[0].node.text;

          const match = text.trim().match(timestampRegex);
          if (!match) {
            return true;
          }

          const videoTime =
            parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);

          const mark = EditorSchema.marks.timestamp.create({ videoTime });
          const textNode = EditorSchema.text(secondsToHhmmss(videoTime), [mark]);

          if (dispatch) {
            dispatch(state.tr.replaceSelectionWith(textNode, false));
          }
        }
      }

      return true;
    };

    // Prosemirror command that retrieves underlying timestamp value from the selection.
    const seekToTimestamp = (state, dispatch) => {
      const { haveTimestamp, videoTime } = getTimestampValueUnderCursor(state);

      if (haveTimestamp) {
        console.log('videoTime to seek to =', secondsToHhmmss(videoTime));
        doCommand('seekToTime', { videoTime });
      }

      return true;
    };

    const putTimestampText = (state, dispatch) => {
      const videoTime = doCommand('currentTime');

      if (Number.isNaN(videoTime)) {
        return true;
      }

      // Create text node with the timestamp mark
      const mark = EditorSchema.marks.timestamp.create({ videoTime });
      const text = EditorSchema.text(secondsToHhmmss(videoTime), [mark]);

      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(text, false));
      }

      return true;
    };

    const debugPrint = (state, dispatch) => {
      const { selection } = state;
      const { $from, $to } = selection;

      console.log('$from.parent', $from.parent, $from.parent.attrs);
      console.log('$to.parent', $to.parent, $to.parent.attrs);

      const printDescendant = (node, pos, parent, index) => {
        console.log('Descendant node -', node);
        if (node.isLeaf) {
          return false;
        }
        return true;
      };

      // console.log('-=-=-=-=-=-= $from.nodesBetween -=-=-=-=-=-=');
      // $from.parent.nodesBetween(0, $from.parent.nodeSize, printDescendant);

      // console.log('-=-=-=-=-=-= $to.nodesBetween -=-=-=-=-=-=');
      // $to.parent.nodesBetween(0, $to.parent.nodeSize, printDescendant);

      return true;
    };

    // Editor command that simply tells the extension to capture the current frame. Does not apply any
    // transaction to the state.
    const tellExtensionToCaptureFrame = (_state, _dispatch) => {
      const { videoId } = parentApp.currentVideoInfo();
      if (videoId) {
        window.frames[0].postMessage({ type: AppConfig.CaptureCurrentFrameMessage }, '*');
      }
      return true;
    };

    // Listener that checks receiving the data url from extension.
    const gotResponseFromExtension = e => {
      if (e.data.type !== AppConfig.CaptureCurrentFrameResponse || !editorView.current) {
        return;
      }

      const { data } = e;
      const { dataURL: source, width: origWidth, height: origHeight } = data;

      // Initial width is same as that of original image width
      const outerWidth = `${origWidth}px`;

      const view = editorView.current;
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
    };

    window.addEventListener('message', gotResponseFromExtension, false);

    // Pause input rule. Typing "#." will toggle pause.
    const ToggleVideoPauseInputRule = new InputRule(/#\.$/, (state, match, start, end) => {
      doCommand('togglePause');
      return state.tr.insertText('', start, end);
    });

    const MakeTimestampInputRule = new InputRule(
      /@([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{1,2}) /,
      (state, match, start, end) => {
        const videoTime =
          parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
        const mark = EditorSchema.marks.timestamp.create({ videoTime });
        console.log('Match =', match);
        // const text = EditorSchema.text(match[0].substring(0, match[0].length - 1), [mark]);
        const text = EditorSchema.text(secondsToHhmmss(videoTime), [mark]);
        console.log('Matched text =', match[0], 'start, end =', start, end);
        console.log('text =', text);
        return state.tr.insertText(text);
      }
    );

    /*
    const placeIntervalWidget = (state, dispatch) => {
      const { $from } = state.selection;
      const index = $from.index();

      console.log('placeIntervalWidget');

      if (!$from.parent.canReplaceWith(index, index, IntervalSliderNodeType)) {
        console.log('canReplaceWith = false');
        return false;
      }

      if (dispatch) {
        console.log('dispatch');
        const node = IntervalSliderNodeType.create({
          onChange: newDelta => {
            console.log('newDelta =', newDelta);
          },
        });
        dispatch(state.tr.replaceSelectionWith(node));
      }

      return true;
    };
    */

    const commandFunctions = {
      toggle_pause: () => doCommand('togglePause'),
      mark_selection_as_timestamp: toggleTimestampMark,
      put_timestamp: putTimestampText,
      seek_to_timestamp: seekToTimestamp,
      capture_frame: tellExtensionToCaptureFrame,
      debug_print: debugPrint,
      turn_text_to_timestamp: turnTextToTimestamp,
    };

    const keymapObject = Object.fromEntries(
      Object.entries(commandNameOfKeycode).map(([keycode, commandName]) => {
        console.log(keycode, commandName);
        return [keycode, commandFunctions[commandName]];
      })
    );

    const menu = buildMenuItems(EditorSchema);
    menu.insertMenu.content.push(wrapInTimeRangeMenuItem);

    const content = document.getElementById('__content__');

    const editorElement = document.getElementById('__editor__');

    if (isLoading) return null;

    const { docJSON } = notes || {};

    const doc = !docJSON
      ? DOMParser.fromSchema(EditorSchema).parse(editorElement)
      : Node.fromJSON(EditorSchema, docJSON);

    editorView.current = new EditorView(editorElement, {
      state: EditorState.create({
        doc,
        plugins: [
          keymap(keymapObject),

          timestampImagePlugin,

          autosavePlugin,

          inputRules({ rules: [ToggleVideoPauseInputRule, MakeTimestampInputRule] }),
          ...exampleSetup({ schema: EditorSchema, menuContent: menu.fullMenu }),
        ],
      }),

      nodeViews: {
        inlineImage: (node, view, getPos) => {
          return new ImageNodeView(node, view, getPos);
        },

        withTimeRange: (node, view, getPos) => {
          return new WithTimeRangeView(node, view, getPos);
        },
      },
    });

    return () => {
      window.removeEventListener('message', gotResponseFromExtension);
      editorView.current.destroy();
    };
  }, [doCommand, parentApp, videoId, isLoading, videoTitle]);

  return (
    <Paper className={classes.editor}>
      <div id="__editor__" />
    </Paper>
  );
};

export default EditorComponent;
