import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import { makeYoutubeUrl, secondsToHhmmss } from './utils';
import PropTypes from 'prop-types';
import AutoReplace from './slate-auto-replace-alt';
import { saveVideoNote, loadVideoNote, NoteData } from './save_note';

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
                                text: '',
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
                trigger: ')',
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
                trigger: ')',
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
                    change.insertText('');
                },
            })
        );

        return plugins;
    }

    constructor(props) {
        super(props);

        this.state = { value: initialEditorValue, showWindowPortal: false };

        this.editorDivRef = undefined;

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

        this.loadNoteForVideo = videoId => {
            if (!videoId) {
                this.props.parentApp.showInfo(
                    'No video current playing. Not loading note.',
                    2,
                    true
                );
                // TODO(rksht): load note independently of video.
            }

            const jsonEditorValue = loadVideoNote(videoId);

            if (!jsonEditorValue) {
                this.props.parentApp.showInfo(`No note saved for videoId = ${videoId}`);
            } else {
                this.setState({ ...this.state, value: Value.fromJSON(jsonEditorValue) });
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
                return this.handleNonHotkey(event, editor, next);
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
                    const { videoId, videoTime } = this.props.parentApp.currentVideoInfo();
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
                    let selection = editor.value.selection;
                    // selection = selection.moveEndBackward(1);

                    console.log('Pressed Ctrl + \\');

                    if (selection.isCollapsed) {
                        console.log('Selection is collapsed');
                        handled = false;
                        break;
                    }

                    console.log('Selection not collapsed');

                    const { videoId, videoTime } = this.props.parentApp.currentVideoInfo();

                    if (!videoId) {
                        handled = false;
                        break;
                    }

                    const timeStampMark = makeYoutubeTimestampMark(videoId, videoTime);
                    editor.addMarkAtRange(selection, timeStampMark);
                    // ^ Could -1 from selection.end too instead of doing this?

                    handled = true;
                    break;
                }

                // Ctrl + s saves current state of editor
                case 's': {
                    const jsonEditorValue = this.state.value.toJSON();
                    const { videoId } = this.props.parentApp.currentVideoInfo();
                    const noteData = new NoteData(videoId, jsonEditorValue);

                    saveVideoNote(noteData, 'sameNoteName');

                    const infoText = `Saved Note for video "${videoId}"`;
                    this.props.parentApp.showInfo(infoText, 2.0);

                    handled = true;
                    break;
                }

                // Ctrl + l will load most recently saved version of this video from local storage
                case 'l': {
                    const { videoId } = this.props.parentApp.currentVideoInfo();
                    this.loadNoteForVideo(videoId);
                    handled = true;
                    break;
                }

                // Ctrl + o will open the saved notes list
                case 'o': {
                    this.setState({ ...this.state, showWindowPortal: true });
                    handled = true;
                    break;
                }

                // Log the editor state
                case 'y': {
                    const valueJson = this.state.value.toJSON();
                    console.log(valueJson);
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

        this.handleNonHotkey = (event, editor, next) => {
            switch (event.key) {
                case 'Backspace': {
                    console.log('Backspace');
                    return this.handleBackspaceKey(event, editor, next);
                }

                case 'Enter': {
                    console.log('Enter');
                    return this.handleEnterKey(event, editor, next);
                }

                case ' ': {
                    console.log('space');
                    return this.handleSpaceKey(event, editor, next);
                }

                default: {
                    return next();
                }
            }
        };

        this.blockTypeOfCharSeq = charSeq => {
            switch (charSeq) {
                case '*':
                case '-':
                case '+':
                    return 'list-item';
                case '>':
                    return 'block-quote';
                case '#':
                    return 'heading-one';
                case '##':
                    return 'heading-two';
                case '###':
                    return 'heading-three';
                case '####':
                    return 'heading-four';
                case '#####':
                    return 'heading-five';
                case '######':
                    return 'heading-six';
                default:
                    return undefined;
            }
        };

        this.renderNode = (props, editor, next) => {
            switch (props.node.type) {
                case 'block-quote':
                    return <blockquote {...props.attributes}>{props.children}</blockquote>;
                case 'bulleted-list':
                    return <ul {...props.attributes}>{props.children}</ul>;
                case 'heading-one':
                    return <h1 {...props.attributes}>{props.children}</h1>;
                case 'heading-two':
                    return <h2 {...props.attributes}>{props.children}</h2>;
                case 'heading-three':
                    return <h3 {...props.attributes}>{props.children}</h3>;
                case 'heading-four':
                    return <h4 {...props.attributes}>{props.children}</h4>;
                case 'heading-five':
                    return <h5 {...props.attributes}>{props.children}</h5>;
                case 'heading-six':
                    return <h6 {...props.attributes}>{props.children}</h6>;
                case 'list-item':
                    return <li {...props.attributes}>{props.children}</li>;
                default:
                    return next();
            }
        };

        this.handleSpaceKey = (event, editor, next) => {
            const { value } = editor;
            const { selection } = value;
            if (!selection.isCollapsed) {
                return next();
            }

            const { startBlock } = value;
            const { start } = selection;

            const charSeq = startBlock.text.slice(0, start.offset).replace(/\s*/, '');

            console.log('charSeq =', charSeq);

            const blockType = this.blockTypeOfCharSeq(charSeq);

            if (!blockType) {
                return next();
            }

            console.log('Creating new block of type ', blockType);

            if (blockType === 'list-item' && startBlock.type === 'list-item') {
                return next();
            }

            event.preventDefault();

            editor.setBlocks(blockType);

            if (blockType === 'list-item') {
                editor.wrapBlock('bulleted-list');
                editor.moveFocusToStartOfNode(startBlock).delete();
            } else {
                editor.insertText(' ');
            }

            // editor.insertText(' ');

            // Not removing the markdown symbols
            // editor.moveFocusToStartOfNode(startBlock).delete();

            return next();
        };

        this.handleBackspaceKey = (event, editor, next) => {
            const { value } = editor;
            const { selection } = value;

            if (!selection.isCollapsed) {
                return next();
            }

            if (selection.start.offset != 0) {
                return next();
            }

            const { startBlock } = value;

            if (startBlock.type === 'paragraph') {
                return next();
            }

            event.preventDefault();

            if (startBlock.type === 'list-item') {
                editor.unwrapBlock('bulleted-list');
            }

            return next();
        };

        this.handleEnterKey = (event, editor, next) => {
            const { value } = editor;
            const { selection } = value;

            const { start, end, isExpanded } = selection;

            if (isExpanded) {
                return next();
            }

            const { startBlock } = value;

            if (start.offset === 0 && startBlock.text.length === 0) {
                return this.handleBackspaceKey(event, editor, next);
            }
            if (end.offset !== startBlock.text.length) {
                return next();
            }

            if (
                startBlock.type !== 'heading-one' &&
                startBlock.type !== 'heading-two' &&
                startBlock.type !== 'heading-three' &&
                startBlock.type !== 'heading-four' &&
                startBlock.type !== 'heading-five' &&
                startBlock.type !== 'heading-six' &&
                startBlock.type !== 'block-quote'
            ) {
                return next();
            }

            event.preventDefault();
            editor.splitBlock().setBlocks('paragraph');
        };
    }

    componentWillReceiveProps(newProps) {
        if (newProps.editorCommand && newProps.editorCommand.name === 'loadNoteForVideo') {
            this.loadNoteForVideo(newProps.editorCommand.videoId);
            newProps.editorCommand.resetCommand();
        }
    }

    render() {
        return (
            <div
                ref={editorDivRef => {
                    this.editorDivRef = editorDivRef;
                    this.props.getEditorRef(editorDivRef);
                }}
            >
                <Editor
                    value={this.state.value}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    renderMark={this.renderMark}
                    renderNode={this.renderNode}
                    className="editor-top-level"
                    autoCorrect={false}
                    plugins={this.plugins}
                />
            </div>
        );
    }
}
