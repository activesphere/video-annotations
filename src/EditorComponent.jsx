import React, { useRef, useEffect } from 'react';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema as BasicSchema } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { toggleMark } from 'prosemirror-commands';

import secondsToHhmmss from './utils/secondsToHhmmsss';

// Schema. Extends the basic schema with timestamps.
const EditorSchema = new Schema({
    nodes: BasicSchema.spec.nodes,
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

const EditorComponent = props => {
    const editorView = useRef(null);

    const { doCommand } = props;

    // Creates the editor on mount
    useEffect(() => {
        const timestemapImagePlugin = new Plugin({
            view: editorView => new TimestampImagePlugin(editorView),
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

        // Pause input rule. Typing "#." will toggle pause.
        const ToggleVideoPauseInputRule = new InputRule(/#\.$/, (state, match, start, end) => {
            doCommand('togglePause');
            return state.tr.insertText('', start, end);
        });

        const content = document.getElementById('__content__');

        const editorElement = document.getElementById('__editor__');

        // create editor
        editorView.current = new EditorView(editorElement, {
            state: EditorState.create({
                doc: DOMParser.fromSchema(EditorSchema).parse(content),
                plugins: [
                    keymap({
                        'Ctrl-t': toggleTimestampMark,
                        'Ctrl-g': seekToTimestamp,
                        'Ctrl-Shift-t': putTimestampText,
                    }),

                    timestemapImagePlugin,

                    inputRules({ rules: [ToggleVideoPauseInputRule] }),
                    ...exampleSetup({ schema: EditorSchema }),
                ],
            }),
        });
    }, [doCommand]);

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
