import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import { makeYoutubeUrl, TEST_VIDEO_ID, GIGANTOR_THEME_SONG } from './utils';

import './EditorTestApp.css';

const MARK_TYPES = {
    YOUTUBE_TIMESTAMP: 'youtube_timestamp',
    BOLD: 'bold',
    ITALIC: 'italic',
    CODE: 'code',
    UNDERLINE: 'underline',
};

const initialEditorValue = Value.fromJSON({
    document: {
        nodes: [
            {
                object: 'block',
                type: 'paragraph',
                nodes: [
                    {
                        object: 'text',
                        leaves: [
                            {
                                text: GIGANTOR_THEME_SONG,
                            },
                        ],
                    },
                ],
            },
        ],
    },
});

const TimestampMarkComponent = props => {
    const style = {
        color: '#9ebdff',
        textDecoration: 'underline',
        fontStyle: 'italic',
        cursor: 'pointer'
    };

    const url = makeYoutubeUrl(props.mark.data.get("videoId"), props.mark.data.get("videoTime"));

    return (
        <a href={url} className="inline-youtube-timestamp" {...props.attributes} style={style}>
            {props.children}
        </a>
    );
};

function makeYoutubeTimestampMark(videoId, videoTime) {
    return Mark.create({ type: MARK_TYPES.YOUTUBE_TIMESTAMP, data: { videoId, videoTime } });
}

const AUTOSAVE = false;

export default class EditorTestApp extends Component {
    constructor(props) {
        super(props);

        this.state = { value: initialEditorValue };

        this.onChange = ({ value }) => {
            // ^ The value that onChange receives as argument is the new value of the editor.

            if (AUTOSAVE && value !== this.state.value) {
                const content = JSON.stringify(value.toJSON());
                localStorage.setItem('saved_editor_state', content);
            }

            this.setState({ value });
        };

        this.renderMark = (props, editor, next) => {
            switch (props.mark.type) {
                case MARK_TYPES.YOUTUBE_TIMESTAMP:
                    return <TimestampMarkComponent {...props} />;

                case MARK_TYPES.BOLD:
                    return <strong {...props.attributes}>{props.children}</strong>;

                case MARK_TYPES.ITALIC:
                    return <em {...props.attributes}>{props.children}</em>;

                case MARK_TYPES.UNDERLINE:
                    return <u {...props.attributes}>{props.children}</u>;

                default:
                    return next();
            }
        };

        this.onKeyDown = (event, editor, next) => {
            if (!event.ctrlKey) {
                return next();
            }

            let handled = false;

            switch (event.key) {
                case 'b': {
                    editor.toggleMark('bold');
                    handled = true;
                    break;
                }

                case 'i': {
                    editor.toggleMark('italic');
                    handled = true;
                    break;
                }

                case 'u': {
                    editor.toggleMark('underline');
                    handled = true;
                    break;
                }

                case 't': {
                    // Test adding a youtube timestamp mark.
                    const timeStampMark = makeYoutubeTimestampMark(TEST_VIDEO_ID, 0);
                    editor.toggleMark(timeStampMark);
                    editor.insertText('Hello Friend');
                    editor.toggleMark(timeStampMark);
                    handled = true;
                    break;
                }

                // Associate a mark at the current selected text
                case '\\': {
                    const selection = editor.value.selection;
                    editor.addMarkAtRange(selection, makeYoutubeTimestampMark(TEST_VIDEO_ID, 20));
                    handled = true;
                    break;
                }

                case 's': {
                    // Ctrl + s saves current state of editor
                    console.log(event);

                    const content = JSON.stringify(this.state.value.toJSON());
                    localStorage.setItem('saved_editor_state', content);
                    handled = true;
                    break;
                }

                // Ctrl + l will load most recently saved version of this video from local storage
                case 'l': {
                    const savedValueJsonStr = localStorage.getItem('saved_editor_state');

                    if (!savedValueJsonStr) {
                        console.warn('No editor Value was previously saved');
                        return next();
                    }

                    const savedJsonValue = JSON.parse(savedValueJsonStr);

                    this.setState({...this.state, value: Value.fromJSON(savedJsonValue) });
                    handled = true;
                    break;
                }

                default:
                    break;
            }

            event.preventDefault();

            if (handled) {
                return true;
            }
            return next();
        };
    }

    render() {
        return (
            <Editor
                value={this.state.value}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
                renderMark={this.renderMark}
            />
        );
    }
}
