import React, { useRef, useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { toggleMark } from 'prosemirror-commands';
import { DOMParser } from 'prosemirror-model';

import EditorSchema, { ImageNodeType } from './prosemirror-plugins/Schema';
import ImageNodeView from './prosemirror-plugins/ImageNodeView';
import TimestampImagePlugin, {
  getTimestampValueUnderCursor,
} from './prosemirror-plugins/TimestampImagePlugin';
import AutosavePlugin from './prosemirror-plugins/AutosavePlugin';
import { loadNoteWithId } from './LocalStorageHelper';
import AppConfig from './AppConfig';
import secondsToHhmmss from './utils/secondsToHhmmsss';

const floorOrZero = n => (Number.isNaN(n) ? 0 : Math.floor(n));

const EditorComponent = props => {
  const editorView = useRef(null);

  const { doCommand, parentApp, videoId } = props;

  useEffect(() => {
    if (!videoId) {
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

    // Prosemirror command that retrieves underlying timestamp value from the selection.
    const seekToTimestamp = (state, dispatch) => {
      const { haveTimestamp, videoTime } = getTimestampValueUnderCursor(state);

      if (haveTimestamp) {
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

    const content = document.getElementById('__content__');

    const editorElement = document.getElementById('__editor__');

    const { docJSON } = loadNoteWithId(videoId);

    const doc = !docJSON
      ? DOMParser.fromSchema(EditorSchema).parse(content)
      : Node.fromJSON(EditorSchema, docJSON);

    editorView.current = new EditorView(editorElement, {
      state: EditorState.create({
        doc,
        plugins: [
          keymap({
            'Ctrl-t': toggleTimestampMark,
            'Ctrl-g': seekToTimestamp,
            'Ctrl-Shift-t': putTimestampText,
            'Ctrl-i': tellExtensionToCaptureFrame,
          }),

          timestemapImagePlugin,

          autosavePlugin,

          inputRules({ rules: [ToggleVideoPauseInputRule] }),
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
      window.removeEventListener('message', gotResponseFromExtension);
      editorView.current.destroy();
    };
  }, [doCommand, parentApp, videoId]);

  return (
    <>
      <div id="__editor__" />
      <div id="__content__">
        <p>Hello, World!</p>
      </div>
    </>
  );
};

export default EditorComponent;
