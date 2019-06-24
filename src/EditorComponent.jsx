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

import EditorSchema from './prosemirror-plugins/Schema';
import ImageNodeView from './prosemirror-plugins/ImageNodeView';
import AutosavePlugin from './prosemirror-plugins/AutosavePlugin';
import { loadNote } from './LocalStorageHelper';
import { commandNameOfKeycode } from './keycodeMap';
import {
  makeCmdToggleTimestampMark,
  makeCmdPutTimestampText,
  cmdTurnTextToTimestamp,
  makeCmdTellExtensionToCaptureFrame,
  makeCmdSeekToTimestamp,
} from './prosemirror-plugins/Commands';

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

    // Commands
    const cmdToggleTimestampMark = makeCmdToggleTimestampMark(doCommand);

    const cmdPutTimestampText = makeCmdPutTimestampText(doCommand);

    const {
      cmdTellExtensionToCaptureFrame,
      extensionResponseHandler,
    } = makeCmdTellExtensionToCaptureFrame(doCommand, parentApp.currentVideoInfo, editorView);

    const cmdSeekToTimestamp = makeCmdSeekToTimestamp(doCommand);

    window.addEventListener('message', extensionResponseHandler, false);

    const cmdDebugPrint = (state, dispatch) => {
      return true;
    };

    // Pause input rule. Typing "#." will toggle pause.
    const ToggleVideoPauseInputRule = new InputRule(/#\.$/, (state, match, start, end) => {
      doCommand('togglePause');
      return state.tr.insertText('', start, end);
    });

    const cmdFunctions = {
      toggle_pause: () => doCommand('togglePause'),
      mark_selection_as_timestamp: cmdToggleTimestampMark,
      put_timestamp: cmdPutTimestampText,
      seek_to_timestamp: cmdSeekToTimestamp,
      capture_frame: cmdTellExtensionToCaptureFrame,
      debug_print: cmdDebugPrint,
      turn_text_to_timestamp: cmdTurnTextToTimestamp,
    };

    // Map from keycode to command function
    const keymapObject = Object.fromEntries(
      Object.entries(commandNameOfKeycode).map(([keycode, cmdName]) => {
        return [keycode, cmdFunctions[cmdName]];
      })
    );

    const autosavePlugin = new Plugin({
      view: editorView => new AutosavePlugin(editorView, videoId),
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
      window.removeEventListener('message', extensionResponseHandler);
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
