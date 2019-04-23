import React, { Component, Fragment } from 'react';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import Plain from 'slate-plain-serializer';
import secondsToHhmmss from './utils/secondsToHhmmsss';
import PropTypes from 'prop-types';
import Prism from './prism_add_markdown_syntax';
import AutoReplace from './slate-auto-replace-alt';
import { noteStorageManager, NoteData } from './save_note';
import Modal from 'react-modal';
import isHotKey from 'is-hotkey';
import keyMap from './keycodeMap';
import { Slide } from '@material-ui/core';
import { SnackbarContext } from './context/SnackbarContext';
import HoverMenu from './editor/HoverMenu';
import TimestampMark from './editor/TimestampMark';
import debounce from './utils/debounce';

Modal.setAppElement('#root');

const initialEditorValue = Plain.deserialize('');

function makeYoutubeTimestampMark(videoId, videoTime) {
    return Mark.create({ type: 'youtube_timestamp', data: { videoId, videoTime } });
}

export default class EditorComponent extends Component {
    static propTypes = {
        parentApp: PropTypes.object.isRequired,
        editorCommand: PropTypes.object,
    };

    static contextType = SnackbarContext;

    saveCurrentNote = debounce(() => {
        const jsonEditorValue = this.state.value.toJSON();
        const { videoId, videoTitle } = this.props.parentApp.currentVideoInfo();
        const noteData = new NoteData(videoId, videoTitle, jsonEditorValue);
        noteStorageManager.saveNoteWithId(videoId, noteData);

        return `Saved Note for video "${videoId}", title - "${videoTitle}"`;
    }, 3000);

    _putTimestampMarkIntoEditor = editor => {
        const { videoId, videoTime } = this.props.parentApp.currentVideoInfo();
        if (!videoId) {
            return false;
        }
        if (!videoTime && videoTime !== 0) {
            return false;
        }

        const timeStampMark = makeYoutubeTimestampMark(videoId, videoTime);
        editor.toggleMark(timeStampMark);
        editor.insertText(secondsToHhmmss(videoTime));
        editor.toggleMark(timeStampMark);
        return true;
    };

    _makePlugins = () => {
        this.plugins = [];

        this.plugins.push(
            AutoReplace({
                trigger: '.',
                before: /[^#]?(#)$/,
                change: change => {
                    change.insertText('');
                    this.props.parentApp.doVideoCommand('playVideo');
                    setTimeout(() => {
                        this.context.openSnackbar({
                            message: `Playing`,
                        });
                    });
                },
            })
        );

        // Pause video key-sequence
        this.plugins.push(
            AutoReplace({
                trigger: '/',
                before: /[^#]?(#)$/,
                change: change => {
                    change.insertText('');
                    this.props.parentApp.doVideoCommand('pauseVideo');
                    setTimeout(() => {
                        this.context.openSnackbar({
                            message: `Paused`,
                        });
                    });
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
            this.props.parentApp.doVideoCommand(videoCommandName);

            console.log(change);
        };

        // Put video timestamp and play (or continue playing) video
        this.plugins.push(
            AutoReplace({
                trigger: '.',
                before: /[^#]?(#t)$/,
                change: change => {
                    putTimestampMark(change, 'playVideo');
                },
            })
        );

        // Put video timestamp and pause video
        this.plugins.push(
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
        this.plugins.push(
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

                    this.props.parentApp.doVideoCommand('addToCurrentTime', {
                        secondsToAdd: deltaTimeInSeconds,
                    });
                    change.insertText('');
                },
            })
        );
    };

    constructor(props) {
        super(props);

        this.state = {
            value: initialEditorValue,
            showGetTimestampTitle: false,
            onTimestamp: false,
        };

        this.editorRef = undefined;

        this.hoverMenuRef = undefined;
    }

    onChange = ({ value }) => {
        if (value.document !== this.state.value.document) {
            this.saveCurrentNote();
        }

        // Check if we are on the boundary of a timestamp mark. If so we
        // will toggle away that mark state.
        const onTimestamp = value.marks.some(({ type }) => type === 'youtube_timestamp');

        this.setState({ onTimestamp, value });
    };

    renderMark = (props, editor, next) => {
        const { attributes, children } = props;
        switch (props.mark.type) {
            case 'youtube_timestamp':
                return <TimestampMark {...props} parentApp={this.props.parentApp} />;

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

    loadNoteForVideo = videoId => {
        if (!videoId) {
            this.context.openSnackbar({
                message: 'No video playing, not loading any note',
            });
        }

        console.log('Loading note for video', videoId);

        const { jsonEditorValue } = noteStorageManager.loadNoteWithId(videoId);

        if (!jsonEditorValue) {
            this.context.openSnackbar({
                message: `No previously saved note for video - ${videoId}`,
            });
            // Load empty editor value
            this.setState({
                ...this.state,
                value: initialEditorValue,
            });
        } else {
            this.setState({
                ...this.state,
                value: Value.fromJSON(jsonEditorValue),
            });
        }
    };

    // Returns a list of all marks within current selection
    getTimestampMarkIfAny = editor => {
        const marks = editor.value.marks;

        const timestampMarks = [];

        for (let mark of marks) {
            if (mark.type === 'youtube_timestamp') {
                timestampMarks.push(
                    makeYoutubeTimestampMark(mark.data.get('videoId'), mark.data.get('videoTime'))
                );
            }
        }

        return timestampMarks;
    };

    onKeyDown = (event, editor, next) => {
        // Special handling of TAB key. Put 4 spaces.
        if (event.keyCode === 9) {
            editor.insertText('    ');
            event.preventDefault();
            return true;
        }

        const actionKey = Object.keys(keyMap).find(k => isHotKey(k, event));
        const action = keyMap[actionKey];

        if (action) {
            event.preventDefault();
            switch (action) {
                case 'togglePause': {
                    this.props.dispatch('togglePause');
                    break;
                }
                case 'putTimestamp': {
                    this._putTimestampMarkIntoEditor(editor);
                    break;
                }
                case 'saveNote': {
                    this.saveCurrentNote();
                    this.context.openSnackbar({ message: `Saved` });
                    break;
                }
                case 'videoForward': {
                    this.props.dispatch('addToCurrentTime', {
                        secondsToAdd: 10,
                    });
                    break;
                }
                case 'videoBackward': {
                    this.props.dispatch('addToCurrentTime', {
                        secondsToAdd: -10,
                    });
                    break;
                }
                default:
                    console.error('Key map error', keyMap, action);
                    break;
            }

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

            case 'd': {
                if (!editor.value.selection.isCollapsed) {
                    break;
                }

                // Get mark under cursor. It's a list, as there can be multiple marks applied to
                // overlapping ranges I guess.
                const marks = editor.value.marks;

                for (let mark of marks) {
                    if (mark.type === 'youtube_timestamp') {
                        const params = {
                            videoId: mark.data.get('videoId'),
                            videoTime: mark.data.get('videoTime'),
                        };

                        // prettier-ignore
                        console.log(
                                `Seeking video ${params.videoId} to time ${secondsToHhmmss(params.videoTime)}`
                            );

                        this.props.parentApp.doVideoCommand('seekToTime', params);
                    }
                }

                handled = true;

                break;
            }

            // Associate a mark at the current selected text
            case '/': {
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

            default:
                break;
        }

        event.preventDefault();

        if (handled) {
            return true;
        }

        return next();
    };

    renderNode = (props, editor, next) => {
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

    updateHoverMenu = () => {
        const menu = this.hoverMenuRef;
        if (!menu) {
            return;
        }

        // console.log('menu =', menu);

        const { value } = this.state;
        const { fragment, selection } = value;

        if (selection.isBlurred || selection.isCollapsed || fragment.text === '') {
            menu.removeAttribute('style');
            return;
        }

        const native = window.getSelection();
        const range = native.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        menu.style.opacity = 1;
        menu.style.top = `${rect.top + window.pageYOffset - menu.offsetHeight}px`;

        menu.style.left = `${rect.left +
            window.pageXOffset -
            menu.offsetWidth / 2 +
            rect.width / 2}px`;
    };

    componentDidMount() {
        this.updateHoverMenu();
    }

    componentDidUpdate() {
        this.updateHoverMenu();
    }

    componentWillReceiveProps(newProps) {
        if (newProps.editorCommand && newProps.editorCommand.name === 'loadNoteForVideo') {
            this.loadNoteForVideo(newProps.editorCommand.videoId);
            newProps.editorCommand.resetCommand();
        }
    }

    renderEditor = (props, editor, next) => {
        const children = next();
        return (
            <Fragment>
                {children}
                <HoverMenu
                    getRef={menu => {
                        this.hoverMenuRef = menu;
                    }}
                    editor={editor}
                />
            </Fragment>
        );
    };

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
        // Pick bg color of editor based on if it's on a timestamp or not.
        const styles = {
            backgroundColor: this.state.onTimestamp ? '#fff4f7' : '#fafaf0',
        };

        return (
            <Slide direction={'left'} in={true} mountOnEnter unmountOnExit>
                <div
                    id="__editor_container_div__"
                    ref={r => {
                        this.props.parentApp.getEditorContainerDiv(r);
                        this.editorContainerDiv = r;
                    }}
                >
                    <Editor
                        defaultValue={this.state.value}
                        value={this.state.value}
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                        renderMark={this.renderMark}
                        renderNode={this.renderNode}
                        renderEditor={this.renderEditor}
                        decorateNode={this.decorateNode}
                        className="editor-top-level"
                        autoCorrect={false}
                        autoFocus={true}
                        placeholder="Write your note here.."
                        style={styles}
                        ref={editorRef => {
                            this.editorRef = editorRef;
                            this.props.parentApp.editorRef = editorRef;
                        }}
                    />
                </div>
            </Slide>
        );
    }
}
