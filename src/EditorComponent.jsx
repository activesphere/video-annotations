import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import Plain from 'slate-plain-serializer';
import { makeYoutubeUrl, secondsToHhmmss } from './utils';
import PropTypes from 'prop-types';
import Prism from './prism_add_markdown_syntax';
import AutoReplace from './slate-auto-replace-alt';
import { saveVideoNote, loadVideoNote, NoteData } from './save_note';

/*
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
*/

const initialEditorValue = Plain.deserialize('');

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
    return Mark.create({ type: 'youtube_timestamp', data: { videoId, videoTime } });
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

        // The slate-auto-replace plugin checks if the trigger character we have given requires
        // pressing mod keys like shift. If so it doesn't proceed with its replacing behavior at
        // all. Could change that myself.

        // Play video key-sequence
        plugins.push(
            AutoReplace({
                trigger: '.',
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
                trigger: '-',
                before: /[^#]?(!#)$/,
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
                before: /[^#]?(!#(-?)([0-9]+)(s|m))$/,
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
            const { attributes, children } = props;
            switch (props.mark.type) {
                case 'youtube_timestamp':
                    return <TimestampMarkComponent {...props} />;

                case 'bold':
                    return <strong {...attributes}>{props.children}</strong>;

                case 'italic':
                    return <em {...attributes}>{children}</em>;

                case 'underline':
                    return <u {...attributes}>{children}</u>;

                case 'code':
                    return <code {...attributes}>{children}</code>;

                case 'title': {
                    return (
                        <span
                            {...attributes}
                            style={{
                                fontWeight: 'bold',
                                fontSize: '20px',
                                margin: '20px 0 10px 0',
                                display: 'inline-block',
                            }}
                        >
                            {children}
                        </span>
                    );
                }

                case 'punctuation': {
                    return (
                        <span {...attributes} style={{ opacity: 0.2 }}>
                            {children}
                        </span>
                    );
                }

                case 'list': {
                    return (
                        <span
                            {...attributes}
                            style={{
                                paddingLeft: '10px',
                                lineHeight: '10px',
                                fontSize: '20px',
                            }}
                        >
                            {children}
                        </span>
                    );
                }

                case 'hr': {
                    return (
                        <span
                            {...attributes}
                            style={{
                                borderBottom: '2px solid #000',
                                display: 'block',
                                opacity: 0.2,
                            }}
                        >
                            {children}
                        </span>
                    );
                }

                default: {
                    return next();
                }
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
                // return this.handleNonHotkey(event, editor, next);
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
                        if (mark.type === 'youtube_timestamp') {
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
    }

    componentWillReceiveProps(newProps) {
        if (newProps.editorCommand && newProps.editorCommand.name === 'loadNoteForVideo') {
            this.loadNoteForVideo(newProps.editorCommand.videoId);
            newProps.editorCommand.resetCommand();
        }
    }

    decorateNode = (node, editor, next) => {
        const others = next() || [];
        if (node.object !== 'block') {
            return others;
        }

        const string = node.text;
        const texts = node.getTexts().toArray();
        const grammar = Prism.languages.markdown;
        const tokens = Prism.tokenize(string, grammar);
        const decorations = [];
        let startText = texts.shift();
        let endText = startText;
        let startOffset = 0;
        let endOffset = 0;
        let start = 0;

        function getLength(token) {
            if (typeof token == 'string') {
                return token.length;
            } else if (typeof token.content == 'string') {
                return token.content.length;
            } else {
                return token.content.reduce((l, t) => l + getLength(t), 0);
            }
        }

        for (const token of tokens) {
            startText = endText;
            startOffset = endOffset;

            const length = getLength(token);
            const end = start + length;

            let available = startText.text.length - startOffset;
            let remaining = length;

            endOffset = startOffset + remaining;

            while (available < remaining) {
                endText = texts.shift();
                remaining = length - available;
                available = endText.text.length;
                endOffset = remaining;
            }

            if (typeof token !== 'string') {
                const dec = {
                    anchor: {
                        key: startText.key,
                        offset: startOffset,
                    },
                    focus: {
                        key: endText.key,
                        offset: endOffset,
                    },
                    mark: {
                        type: token.type,
                    },
                };

                decorations.push(dec);
            }

            start = end;
        }

        return [...others, ...decorations];
    };

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
                    decorateNode={this.decorateNode}
                    className="editor-top-level"
                    autoCorrect={false}
                    plugins={this.plugins}
                    placeholder="Write your note here.."
                />
            </div>
        );
    }
}
