import React, { useRef, useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer, Node } from 'prosemirror-model';
import { schema as BasicSchema } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { toggleMark } from 'prosemirror-commands';

import AppConfig from './AppConfig';
import secondsToHhmmss from './utils/secondsToHhmmsss';
import * as LS from './LocalStorageHelper';
import debounce from './utils/debounce';

const floorOrZero = n => (Number.isNaN(n) ? 0 : Math.floor(n));

const ImageNodeSpec = {
    attrs: { src: '', videoTime: 0 },
    inline: true,
    group: 'inline',
    draggable: true,
    toDOM: node => [
        'img',
        {
            src: node.attrs.src,
            class: 'inline-image',
        },
    ],
    parseDOM: [
        {
            tag: 'img.inline-image',
            getAttrs: domNode => {
                const src = domNode.getAttribute('src');
                const videoTime = domNode.getAttribute('videoTime');
                return { src, videoTime };
            },
        },
    ],
};

// Schema. Extends the basic schema with timestamps.
const EditorSchema = new Schema({
    nodes: BasicSchema.spec.nodes.addBefore('image', 'inlineImage', ImageNodeSpec),
    marks: BasicSchema.spec.marks.append({
        timestamp: {
            attrs: { videoTime: 0 },
            toDOM: node => ['timestamp', {}],
            parseDOM: [
                {
                    tag: 'timestamp',
                    getAttrs: dom => ({ href: dom.href }),
                },
            ],
            inclusive: false,
        },
    }),
});

// Helper function to get the underlying timestamp value from current selection, if one exists in
// the selection.
function getTimestampValueUnderCursor(state) {
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

// Test tooltip image. Will remove and use image associated with the timestamp.
// const tooltipImageSrc = 'https://i.imgur.com/cD5ATL8.jpg';
const tooltipImageSrc = 'https://images-na.ssl-images-amazon.com/images/I/41vIWnj-QsL._UX395_.jpg';

class TimestampImagePlugin {
    constructor(view) {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'timestamp-tooltip';
        view.dom.parentNode.appendChild(this.tooltip);

        this.imageElement = document.createElement('img');
        this.imageElement.setAttribute('src', tooltipImageSrc);

        this.tooltip.appendChild(this.imageElement);

        this.update(view, null);
    }

    update(view, lastState) {
        let state = view.state;

        // Don't do anything if the document/selection didn't change
        if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection)) {
            return;
        }

        if (state.selection.empty) {
            this.tooltip.style.display = 'none';
            return;
        }

        const { haveTimestamp } = getTimestampValueUnderCursor(state);

        if (!haveTimestamp) {
            this.tooltip.style.display = 'none';
            return;
        }

        this.tooltip.style.display = '';

        const { from } = state.selection;

        const start = view.coordsAtPos(from);

        this.tooltip.style.left = `${start.left + 10}px`;
        this.tooltip.style.top = `${start.top + 20}px`;
    }

    destroy() {
        this.tooltip.remove();
    }
}

const debouncedSaveNote = debounce((videoId, noteData) => {
    LS.saveNoteWithId(videoId, noteData);
}, 3000);

class AutosavePlugin {
    constructor(view, videoId) {
        this.view = view;
        this.videoId = videoId;
        this.update(view, null);
    }

    update() {
        const docJSON = this.view.state.doc.toJSON();

        const noteData = {
            videoId: this.videoId,
            docJSON,
            timeOfSave: Date.now() / 1000.0,
        };

        console.log('Saving note -', this.videoId, docJSON);

        debouncedSaveNote(this.videoId, noteData);
    }

    destroy() {}
}

const ImageNodeType = EditorSchema.nodes['inlineImage'];

const EditorComponent = props => {
    const editorView = useRef(null);

    const { doCommand, parentApp, videoId } = props;

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

        return toggleMark(EditorSchema.marks.timestamp, { videoTime: Math.floor(videoTime) })(
            state,
            dispatch
        );
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

        const view = editorView.current;
        const { state } = view;

        const { $from } = state.selection;
        const index = $from.index;

        if (!$from.parent.canReplaceWith(index, index, ImageNodeType)) {
            return;
        }

        const videoTime = floorOrZero(doCommand('currentTime'));

        const newState = state.apply(
            state.tr.replaceSelectionWith(ImageNodeType.create({ src: e.data.dataUrl, videoTime }))
        );

        view.updateState(newState);
    };

    useEffect(() => {
        const timestemapImagePlugin = new Plugin({
            view: editorView => new TimestampImagePlugin(editorView),
        });

        const autosavePlugin = new Plugin({
            view: editorView =>
                new AutosavePlugin(editorView, parentApp.currentVideoInfo().videoId),
        });

        window.addEventListener('message', gotResponseFromExtension, false);

        // Pause input rule. Typing "#." will toggle pause.
        const ToggleVideoPauseInputRule = new InputRule(/#\.$/, (state, match, start, end) => {
            doCommand('togglePause');
            return state.tr.insertText('', start, end);
        });

        const content = document.getElementById('__content__');

        const editorElement = document.getElementById('__editor__');

        const { docJSON } = LS.loadNoteWithId(videoId);
        // const doc = DOMParser.fromSchema(EditorSchema).parse(content);
        // const doc = DOMParser.fromSchema(EditorSchema).parse(content);
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
        });

        return () => {
            window.removeEventListener('message', gotResponseFromExtension);
            editorView.current.destroy();
        };
    });

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
