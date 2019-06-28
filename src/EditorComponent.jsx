import React, { useRef, useEffect, useState } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { DOMParser } from 'prosemirror-model';
import Paper from '@material-ui/core/Paper';
import { makeStyles, createStyles } from '@material-ui/core/styles';

import AppConfig from './AppConfig';
import EditorSchema from './prosemirror-plugins/Schema';
import ImageNodeView from './prosemirror-plugins/ImageNodeView';
import AutosavePlugin from './prosemirror-plugins/AutosavePlugin';
import { loadNote } from './LocalStorageHelper';
import keycodes from './keycodeMap';
import {
  insertImageForTime,
  mkInsertTimestampStr,
  mkSeekToTimestamp,
  mkToggleTimestampMark,
  textToTimestamp,
} from './prosemirror-plugins/commands';

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import './editor-styles.css';

const useStyles = makeStyles(theme =>
  createStyles({
    editor: {
      margin: theme.spacing(2),
    },
  })
);

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

    const currentTimestamp = () => doCommand('currentTime');

    // Commands
    const messageHandler = e => {
      if (e.data.type !== AppConfig.CaptureCurrentFrameResponse || !editorView.current) return;

      insertImageForTime(e, currentTimestamp(), editorView.current);
    };

    const onCaptureFrame = () => {
      const { videoId } = parentApp.currentVideoInfo();
      if (videoId) {
        window.frames[0].postMessage({ type: AppConfig.CaptureCurrentFrameMessage }, '*');
      }

      return true;
    };

    window.addEventListener('message', messageHandler, false);

    // Pause input rule. Typing "#." will toggle pause.
    const ToggleVideoPauseInputRule = new InputRule(/#\.$/, (state, match, start, end) => {
      doCommand('togglePause');
      return state.tr.insertText('', start, end);
    });

    const cmdFunctions = {
      toggle_pause: () => doCommand('togglePause'),
      mark_selection_as_timestamp: mkToggleTimestampMark(currentTimestamp),
      put_timestamp: mkInsertTimestampStr(currentTimestamp),
      seek_to_timestamp: mkSeekToTimestamp(videoTime => doCommand('seekToTime', { videoTime })),
      capture_frame: onCaptureFrame,
      debug_print: () => true,
      turn_text_to_timestamp: textToTimestamp,
    };

    const keymapObject = Object.keys(keycodes)
      .map(k => [keycodes[k], cmdFunctions[k]])
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

    const autosavePlugin = new Plugin({
      view: editorView =>
        new AutosavePlugin(editorView, notes ? notes.name : null, videoId, videoTitle),
    });

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

          autosavePlugin,

          inputRules({
            rules: [ToggleVideoPauseInputRule],
          }),
          ...exampleSetup({ schema: EditorSchema }),
        ],
      }),

      nodeViews: {
        inlineImage: (node, view, getPos) => {
          return new ImageNodeView(node, view, getPos);
        },
      },
    });

    return () => {
      window.removeEventListener('message', messageHandler);
      editorView.current.destroy();
    };
  }, [doCommand, parentApp, videoId, isLoading, videoTitle, notes]);

  return (
    <Paper className={classes.editor}>
      <div id="__editor__" />
    </Paper>
  );
};

export default EditorComponent;
