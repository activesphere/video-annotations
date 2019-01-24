import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import { makeYoutubeUrl, secondsToHhmmss, TEST_VIDEO_ID, GIGANTOR_THEME_SONG } from './utils';
import PropTypes from 'prop-types';
import AutoReplace from 'slate-auto-replace';
import { saveVideoNote } from './save_note';

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
        cursor: 'pointer',
    };

    const url = makeYoutubeUrl(props.mark.data.get('videoId'), props.mark.data.get('videoTime'));

    const openUrl = () => {
        window.open(url);
    };

    return (
        <a
            href={url}
            onClick={openUrl}
            className="inline-youtube-timestamp"
            {...props.attributes}
            style={style}
        >
            {props.children}
        </a>
    );
};

function makeYoutubeTimestampMark(videoId, videoTime) {
    return Mark.create({ type: MARK_TYPES.YOUTUBE_TIMESTAMP, data: { videoId, videoTime } });
}

const AUTOSAVE = false;

export default class EditorComponent extends Component {
    static propTypes = {
        parentApp: PropTypes.object.isRequired,
        editorCommand: PropTypes.object,
        getEditorRef: PropTypes.func.isRequired,
    };

    // Just a place to create the plugins in. The action functions of the plugins do need to use
    // `this`. So this is a method rather than a free function.
    _makePlugins() {
        let plugins = [];

        // Play video key-sequence
        plugins.push(
            AutoReplace({
                trigger: '>',
                before: /[^#]?(#)$/,
                change: change => {
                    change.insertText('');
                    this.props.parentApp.doVideoCommand({ name: 'playVideo' });
                },
            })
        );

        // Pause video key-sequence
        plugins.push(
            AutoReplace({
                trigger: '/',
                before: /[^#]?(#)$/,
                change: change => {
                    change.insertText('');
                    this.props.parentApp.doVideoCommand({ name: 'pauseVideo' });
                },
            })
        );

        // Puts a timestamp mark. Used by the following AutoReplace plugins
        const putTimestampMark = (change, videoCommandName) => {
            const { videoId, videoTime } = this.props.parentApp.currentVideoInfo();
            if (!videoId) {
                return;
            }
            if (!videoTime && videoTime !== 0) {
                return;
            }

            const timeStampMark = makeYoutubeTimestampMark(videoId, videoTime);
            change.toggleMark(timeStampMark);
            change.insertText(secondsToHhmmss(videoTime));
            change.toggleMark(timeStampMark);
            this.props.parentApp.doVideoCommand({ name: videoCommandName });

            console.log(change);
        };

        // Put video timestamp and play (or continue playing) video
        plugins.push(
            AutoReplace({
                trigger: '>',
                before: /[^#]?(#t)$/,
                change: change => {
                    putTimestampMark(change, 'playVideo');
                },
            })
        );

        // Put video timestamp and pause video
        plugins.push(
            AutoReplace({
                trigger: '/',
                before: /[^#]?(#t)$/,
                change: change => {
                    putTimestampMark(change, 'pauseVideo');
                },
            })
        );

        // Seek to time. The format of input is /#-?[0-9]+(s|m)s/. So input #, then -10s, then s,
        // and you go back 10 seconds. The full sequence is #-10ss.
        plugins.push(
            AutoReplace({
                trigger: 's',
                before: /[^#]?(#(-?)([0-9]+)(s|m))$/,
                change: (change, event, matches) => {
                    const groups = matches.before;
                    const amount = +groups[3];
                    const unit = groups[4] === 's' ? 1 : 60;
                    const sign = groups[2] === '-' ? -1 : 1;
                    const deltaTimeInSeconds = sign * amount * unit;

                    console.log('addToCurrentTime', deltaTimeInSeconds, ' seconds');

                    this.props.parentApp.doVideoCommand({
                        name: 'addToCurrentTime',
                        secondsToAdd: deltaTimeInSeconds,
                    });
                    change.insertText('.');
                },
            })
        );

        return plugins;
    }

    constructor(props) {
        super(props);

        this.state = { value: initialEditorValue };

        this.editorRef = undefined;

        this.plugins = this._makePlugins();

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
            // Special handling of TAB key. Put 4 spaces.
            if (event.keyCode === 9) {
                editor.insertText('    ');
                event.preventDefault();
                return true;
            }

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
                    const {videoId, videoTime} = this.props.parentApp.currentVideoInfo();
                    const timeStampMark = makeYoutubeTimestampMark(videoId, videoTime);
                    editor.toggleMark(timeStampMark);
                    editor.insertText('Hello Friend');
                    editor.toggleMark(timeStampMark);
                    handled = true;
                    break;
                }

                case 'd': {
                    if (!editor.value.selection.isCollapsed) {
                        break;
                    }

                    // Get mark under cursor. It's a list, as there can be multiple marks applied to
                    // overlapping ranges I guess.
                    const marks = editor.value.marks;

                    for (let mark of marks) {
                        if (mark.type === MARK_TYPES.YOUTUBE_TIMESTAMP) {
                            const videoCommand = {
                                name: 'seekToTime',
                                videoId: mark.data.get('videoId'),
                                videoTime: mark.data.get('videoTime'),
                            };

                            console.log(
                                `Seeking video ${videoCommand.videoId} to time ${secondsToHhmmss(
                                    videoCommand.videoTime
                                )}`
                            );

                            this.props.parentApp.doVideoCommand(videoCommand);
                        }
                    }

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
                    // console.log(event);

                    console.log('Saving note');

                    const strEditorState = JSON.stringify(this.state.value.toJSON());
                    // localStorage.setItem('saved_editor_state', strEditorState);

                    const {videoId} = this.props.parentApp.currentVideoInfo();
                    saveVideoNote(videoId, strEditorState, "sameNoteName");

                    const infoText = `Saved Note for video "${videoId}"`;
                    this.props.parentApp.showInfo(infoText, 2.0);

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

                    this.setState({ ...this.state, value: Value.fromJSON(savedJsonValue) });
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
                className="editor-top-level"
                autoCorrect={false}
                refs={editorRef => {
                    this.editorRef = editorRef;
                    this.props.getEditorRef = editorRef;
                }}
                plugins={this.plugins}
            />
        );
    }
}