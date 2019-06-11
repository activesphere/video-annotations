import React, { useRef, useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, Node } from 'prosemirror-model';
import { schema as BasicSchema } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { toggleMark } from 'prosemirror-commands';

import AppConfig from './AppConfig';
import secondsToHhmmss from './utils/secondsToHhmmsss';
import * as LS from './LocalStorageHelper';
import debounce from './utils/debounce';

// Test tooltip image. Will remove and use image associated with the timestamp.

const tooltipImageSrc = 'https://i.imgur.com/cD5ATL8.jpg';

const floorOrZero = n => (Number.isNaN(n) ? 0 : Math.floor(n));

const ImageNodeSpec = {
    attrs: {
        source: '',

        videoTime: { default: 0 },

        origWidth: 100,
        origHeight: 100,
        // ^ In pixels. Original dimensions of the image as received from extension. Not using these two *yet*.

        outerWidth: '10px',
    },
    inline: true,
    group: 'inline',
    draggable: true,

    // toDOM is not used
    toDOM: node => [
        'span',
        {
            style: `width: ${node.attrs.outerWidth}`,
            ...node.attrs,
        },
    ],
    parseDOM: [
        {
            tag: 'img.inline-image',
            getAttrs: domNode => {
                return {
                    source: domNode.getAttribute('source'),
                    videoTime: domNode.getAttribute('videoTime'),
                    outerWidth: domNode.getAttribute('outerWidth'),
                    origWidth: domNode.getAttribute('origWidth'),
                    origHeight: domNode.getAttribute('origHeight'),
                };
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

// Custom node view that allows you to resize images.
class ImageNodeView {
    constructor(node, view, getPos) {
        const outerDOM = document.createElement('span');
        outerDOM.style.position = 'relative';
        outerDOM.style.width = node.attrs.outerWidth;
        outerDOM.style.display = 'inline-block';
        // outerDOM.style.lineHeight = '0';

        const img = document.createElement('img');
        img.setAttribute('src', node.attrs.source);
        img.setAttribute('videoTime', node.attrs.videoTime);
        img.style.width = '100%';

        const resizeHandleDOM = document.createElement('span');
        resizeHandleDOM.style.position = 'absolute';
        resizeHandleDOM.style.bottom = '0px';
        resizeHandleDOM.style.right = '0px';
        resizeHandleDOM.style.width = '10px';
        resizeHandleDOM.style.height = '10px';
        resizeHandleDOM.style.border = '3px solid black';
        resizeHandleDOM.style.borderTop = 'none';
        resizeHandleDOM.style.borderLeft = 'none';
        resizeHandleDOM.style.display = 'none';
        resizeHandleDOM.style.cursor = 'nwse-resize';

        resizeHandleDOM.onmousedown = e => {
            e.preventDefault();

            const startX = e.pageX;

            const startWidth = floorOrZero(parseFloat(node.attrs.outerWidth.match(/(.+)px/)[1]));

            let newWidthInPixels = startWidth;

            const onMouseMove = e => {
                const currentX = e.pageX;

                // Don't want resizing to more than original width
                const diffInPixels = currentX - startX;
                newWidthInPixels = diffInPixels + startWidth;
                outerDOM.style.width = `${newWidthInPixels}px`;
            };

            const onMouseUp = e => {
                e.preventDefault();

                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                const tr = view.state.tr
                    .setNodeMarkup(getPos(), null, {
                        source: node.attrs.source,
                        outerWidth: outerDOM.style.width,
                        origWidth: node.attrs.origWidth,
                        origHeight: node.attrs.origHeight,
                    })
                    .setSelection(view.state.selection);

                view.dispatch(tr);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        outerDOM.appendChild(resizeHandleDOM);
        outerDOM.appendChild(img);

        this.dom = outerDOM;
        this.resizeHandleDOM = resizeHandleDOM;
        this.img = img;
    }

    selectNode() {
        this.img.classList.add('ProseMirror-selectednode');
        this.resizeHandleDOM.style.display = '';
    }

    deselectNode() {
        this.img.classList.remove('ProseMirror-selectednode');
        this.resizeHandleDOM.style.display = 'none';
    }
}

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
