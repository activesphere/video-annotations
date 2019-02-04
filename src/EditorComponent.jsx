import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import Plain from 'slate-plain-serializer';
import { makeYoutubeUrl, secondsToHhmmss } from './utils';
import PropTypes from 'prop-types';
import Prism from './prism_add_markdown_syntax';
import AutoReplace from './slate-auto-replace-alt';
import { noteStorageManager, NoteData } from './save_note';
import { Menu, contextMenu, Item, Separator, Submenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.min.css';
import Modal from 'react-modal';
import MathJax from 'MathJax'; // External

console.log('MathJax = ', MathJax);

Modal.setAppElement('#root');

const initialEditorValue = Plain.deserialize('');

// Context menu that is shown when user selects a range of text and right clicks.
const EditorContextMenu = ({ storedTimestamps, parentEditor, currentlyPlayingVideo }) => {
    const timestampItems = storedTimestamps.map(s => {
        return (
            <Item
                onClick={() => {
                    if (currentlyPlayingVideo !== s.videoId) {
                        console.log('Attempted to put timestamp saved for different video');
                        return;
                    }
                    const editor = parentEditor.editorRef;
                    const selection = editor.value.selection;
                    const timeStampMark = makeYoutubeTimestampMark(s.videoId, s.videoTime);
                    editor.addMarkAtRange(selection, timeStampMark);
                }}
                key={`${s.videoTime}_${s.videoId}`}
            >
                {`${s.text}(${secondsToHhmmss(s.videoTime)})`}
            </Item>
        );
    });

    return (
        <Menu id="editor_context_menu">
            <Submenu label="Set timestamp">{timestampItems}</Submenu>
            <Separator />
            <Item> Add timestamp</Item>
            <Item> Add current timestamp</Item>
        </Menu>
    );
};

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

class StoredTimestamp {
    constructor(videoId, videoTime, text = '') {
        this.videoId = videoId;
        this.videoTime = videoTime;
        this.text = text;
    }
}

export default class EditorComponent extends Component {
    static propTypes = {
        parentApp: PropTypes.object.isRequired,
        editorCommand: PropTypes.object,
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
                trigger: '.',
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

        this.state = { value: initialEditorValue, showGetTimestampTitle: false };

        this.editorRef = undefined;

        this.plugins = this._makePlugins();

        // A list of stored timestamps for later use.
        this.storedTimestamps = [];

        this.onChange = ({ value }) => {
            // ^ The value that onChange receives as argument is the new value of the editor.
            if (AUTOSAVE && value !== this.state.value) {
                const content = JSON.stringify(value.toJSON());
                localStorage.setItem('saved_editor_state', content);
            }

            // We can call mathjax to typeset the page here. TODO(rksht): don't tell it to update only
            // when there's at least one inline math element in the block that is currently being
            // edited?
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, '__editor_container_div__']);

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
                        <span {...attributes} className="title">
                            {children}
                        </span>
                    );
                }

                case 'url': {
                    return (
                        <a {...attributes} className="url">
                            {children}
                        </a>
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
                        <span {...attributes} className="bulleted-list">
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

                case 'inlinemath': {
                    return (
                        <span {...attributes} className="inlinemath">
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

            console.log('Loading note for video', videoId);

            const { jsonEditorValue } = noteStorageManager.loadNoteWithId(videoId);

            if (!jsonEditorValue) {
                this.props.parentApp.showInfo(
                    `No note previously saved for videoId = ${videoId}`,
                    2
                );
                // Load empty editor value
                this.setState({ ...this.state, value: initialEditorValue });
            } else {
                this.setState({ ...this.state, value: Value.fromJSON(jsonEditorValue) });
            }
        };

        // Returns a list of all marks within current selection
        this.getTimestampMarkIfAny = editor => {
            const marks = editor.value.marks;

            const timestampMarks = [];

            for (let mark of marks) {
                if (mark.type === 'youtube_timestamp') {
                    timestampMarks.push(
                        makeYoutubeTimestampMark(
                            mark.data.get('videoId'),
                            mark.data.get('videoTime')
                        )
                    );
                }
            }

            return timestampMarks;
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

                            // prettier-ignore
                            console.log(
                                `Seeking video ${videoCommand.videoId} to time ${secondsToHhmmss(videoCommand.videoTime)}`
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

                    handled = true;
                    break;
                }

                // Ctrl + s saves current state of editor
                case 's': {
                    const jsonEditorValue = this.state.value.toJSON();
                    const { videoId, videoTitle } = this.props.parentApp.currentVideoInfo();
                    const noteData = new NoteData(videoId, videoTitle, jsonEditorValue);

                    noteStorageManager.saveNoteWithId(videoId, noteData);

                    const infoText = `Saved Note for video "${videoId}", title - "${videoTitle}"`;
                    this.props.parentApp.showInfo(infoText, 2.0);
                    this.props.parentApp.updateNoteMenu();

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
                    this.setState({ ...this.state });
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

                // Toggle the timestamp at current selection
                case '-': {
                    const timestampMarks = this.getTimestampMarkIfAny(editor);

                    for (let mark of timestampMarks) {
                        console.log('Toggling timeStampMark');
                        editor.toggleMark(mark);
                    }

                    handled = true;
                    break;
                }

                // Save current timestamp with a name for later use. Pauses the video then brings up
                // a modal for taking the name, saves timestamp with name, and unpauses video if it
                // was initially unpaused.
                case 'h': {
                    this.initSaveTimestampModal();
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

        this.showContextMenuOnRightClick = event => {
            // Selection collapsed? Then don't show this menu.
            if (this.state.value.selection.isCollapsed) {
                return false;
            }

            event.preventDefault();

            contextMenu.show({
                id: 'editor_context_menu',
                event: event,
                props: {
                    value: this.state.value, // Editor value
                    storedTimestamps: this.storedTimestamps,
                },
            });
        };

        this.initSaveTimestampModal = () => {
            const videoTimeToSet = this.props.parentApp.currentVideoInfo().videoTime;
            if (!videoTimeToSet) {
                console.log('Error - video not playing');
                return;
            }

            this.setState({ ...this.state, showGetTimestampTitle: true, videoTimeToSet });
            console.log('Asking to save timestamp');
        };

        this.saveTimestamp = timestampName => {
            const { videoId } = this.props.parentApp.currentVideoInfo();
            const videoTime = Math.floor(this.state.videoTimeToSet);

            console.log('Saving timestamp to list', videoTime);

            // Add to our list if it doesn't exist.
            for (let i = 0; i < this.storedTimestamps; ++i) {
                if (
                    this.storedTimestamps[i].videoTime === videoTime &&
                    this.storedTimestamps[i].text === timestampName
                ) {
                    return;
                }
            }

            this.storedTimestamps.push(new StoredTimestamp(videoId, videoTime, timestampName));
        };

        // Stored timestamps
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
        const modalAfterOpen = () => {
            console.log('Opened modal');
        };

        const { videoId } = this.props.parentApp.currentVideoInfo();

        return (
            <div id="__editor_container_div__">
                <div onContextMenu={this.showContextMenuOnRightClick}>
                    <EditorContextMenu
                        parentEditor={this}
                        storedTimestamps={this.storedTimestamps}
                        currentlyPlayingVideo={videoId}
                    />
                    <Editor
                        defaultValue={this.state.value}
                        value={this.state.value}
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                        renderMark={this.renderMark}
                        renderNode={this.renderNode}
                        decorateNode={this.decorateNode}
                        className="editor-top-level"
                        autoCorrect={false}
                        autoFocus={true}
                        plugins={this.plugins}
                        placeholder="Write your note here.."
                        ref={editorRef => {
                            this.editorRef = editorRef;
                        }}
                    />

                    <Modal
                        isOpen={this.state.showGetTimestampTitle}
                        onAfterOpen={modalAfterOpen}
                        contentLabel="Timestamp title"
                        className="modal"
                        overlayClassName="overlay"
                    >
                        <form
                            onSubmit={event => {
                                this.saveTimestamp(event.target.value);
                                this.setState({
                                    ...this.state,
                                    showGetTimestampTitle: false,
                                    videoTimeToSet: undefined,
                                });
                                event.preventDefault();
                            }}
                        >
                            <label>
                                Timestamp name:
                                <input type="text" name="name" />
                            </label>
                            <input type="submit" value="Submit" />
                        </form>
                    </Modal>
                </div>
            </div>
        );
    }
}
