import { secondsToHhmmss } from './utils';
import NoteData from './NoteData';
import keyMap from './keycodeMap';
import { SnackbarContext } from './context/SnackbarContext';
import HoverMenu from './editor/HoverMenu';
import TimestampMark from './editor/TimestampMark';
import debounce from './utils/debounce';
import dropboxHelper from './dropboxHelper';
import * as LS from './LocalStorageHelper';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Editor } from 'slate-react';
import { Value, Mark } from 'slate';
import Plain from 'slate-plain-serializer';
import PropTypes from 'prop-types';
import Prism from './prism_add_markdown_syntax';
import AutoReplace from './slate-auto-replace-alt';
import isHotKey from 'is-hotkey';
import { Slide } from '@material-ui/core';

const initialEditorValue = Plain.deserialize('');

function makeYoutubeTimestampMark(videoId, videoTime) {
    return Mark.create({ type: 'youtube_timestamp', data: { videoId, videoTime } });
}

const AUTOSAVE = true;

// Plugin to save and restore cursor selection on blur and focus respectively.
class SaveAndRestoreSelection {
    selection = undefined;

    onBlur = (event, editor, next) => {
        this.selection = editor.value.selection;
        console.log(
            'Saving selection onBlur, selection undefined?',
            !!this.selection ? 'no' : 'yes'
        );
        return next();
    };

    onFocus = (event, editor, next) => {
        console.log('SaveAndRestoreSelection onFocus');

        if (!this.selection) {
            return next();
        }

        if (this.selection && this.selection.isCollapsed) {
            event.preventDefault();
        } else {
            return next();
        }

        const savedSelection = this.selection;
        this.selection = undefined;

        // Slate's onFocus calls editor.deselect. Don't want that to occur at the end. So let
        // everything occur first, and then we will restore the selection as the last action.
        // Using setTimeout for that purpose.

        setTimeout(() => {
            if (savedSelection.isUnset) {
                return next();
            }

            const el = ReactDOM.findDOMNode(editor);

            el.focus();
        });
    };
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
        LS.saveNoteWithId(LS.idToNoteData, videoId, noteData);
        dropboxHelper.save(noteData).catch(error => {
            console.log(error);
            this.context.openSnackbar({
                message: `Failed to upload to dropbox - ${error}`,
            });
        });
        this.props.parentApp.updateNoteMenu();
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

        this.plugins.push(new SaveAndRestoreSelection());
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
        this._makePlugins();
        this.selectionBeforeBlur = undefined;
    }

    onChange = change => {
        let { value } = change;

        // ^ The value that onChange receives as argument is the new value of the editor.
        // Main reason we are overriding is to setState with the new value.
        if (AUTOSAVE && value.document !== this.state.value.document) {
            this.saveCurrentNote();
        }

        // We can call mathjax to typeset the page here. TODO(rksht): don't tell it to update only
        // when there's at least one inline math element in the block that is currently being
        // edited?
        // MathJax.Hub.Queue(['Typeset', MathJax.Hub, '__editor_container_div__']);

        // Check if we are on the boundary of a timestamp mark. If so we will toggle away that mark state.
        const onTimestamp = value.marks.some(mark => mark.type === 'youtube_timestamp');
        this.setState({ onTimestamp, value });
    };

    renderMark = (props, editor, next) => {
        const { mark, attributes, children } = props;
        switch (mark.type) {
            case 'youtube_timestamp':
                return (
                    <TimestampMark {...props} parentApp={this.props.parentApp} {...attributes} />
                );

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
                message: `No video playing, not loading any note`,
            });
        }

        console.log('Loading note for video', videoId);

        const { editorValueAsJson } = LS.loadNoteWithId(LS.idToNoteData, videoId);

        if (!editorValueAsJson) {
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
                value: Value.fromJSON(editorValueAsJson),
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

                case 'save': {
                    this.saveCurrentNote();
                    break;
                }

                case 'captureFrame': {
                    const { videoId } = this.props.parentApp.currentVideoInfo();
                    if (!videoId) {
                        this.context.openSnackbar({
                            message: 'No video currently playing',
                            autoHideDuration: 1000,
                        });
                        return;
                    }
                    window.frames[0].postMessage({ type: 'VID_ANNOT_CAPTURE_CURRENT_FRAME' }, '*');
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

        let handled = false;

        if (event.key === 'Enter') {
            // When we are in an 'image' block, we don't want to split into two image blocks. The
            // new block should just be a paragraph.
            if (editor.value.startBlock.type === 'image') {
                editor.splitBlock().setBlocks('paragraph');
                handled = true;
            } else {
                return next();
            }
        }

        if (!event.ctrlKey) {
            // return this.handleNonHotkey(event, editor, next);
            return next();
        }

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

            case 'image': {
                const dataUrl = props.node.data.get('dataUrl');
                // console.log('Renderin image node - dataUrl=', dataUrl);
                // console.log('children =', props.children);
                const { attributes, isSelected } = props;

                const styles = {
                    boxShadow: isSelected ? '3px 3px 2px 2px green' : '1px 1px 1px 1px purple',
                    marginLeft: '2em',
                    backgroundColor: '0xe6e6e6',
                };

                return (
                    <>
                        {props.children}
                        <img src={dataUrl} {...attributes} alt={'Captured Frame'} style={styles} />
                    </>
                );
            }

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

    handleWindowClose = ev => {
        ev.preventDefault();
        LS.flushToLocalStorage(LS.idToNoteData);
    };

    componentDidMount() {
        this.updateHoverMenu();
        window.addEventListener('beforeunload', this.handleWindowClose);
        window.addEventListener('message', this.handleFrameCapture, false);
        console.log('window.addEventListener(this.handleFrameCapture)');
    }

    componentWillUnmount() {
        LS.flushToLocalStorage(LS.idToNoteData);
        window.removeEventListener('beforeunload', this.handleWindowClose);
        window.removeEventListener('message', this.handleFrameCapture);
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

    handleFrameCapture = e => {
        if (e.data.type === 'VID_ANNOT_CAPTURED_FRAME') {
            console.log('Received image data');
            this.context.openSnackbar({
                message: 'Received image data...',
                autoHideDuration: 1000,
            });
            this.editorRef.insertBlock({
                type: 'image',
                data: { dataUrl: e.data.dataUrl },
            });
            //.insertBlock('paragraph');
        }
    };

    renderEditor = (props, editor, next) => {
        const children = next();
        return (
            <React.Fragment>
                {children}
                <HoverMenu
                    getRef={menu => {
                        this.hoverMenuRef = menu;
                    }}
                    editor={editor}
                />
            </React.Fragment>
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
                <div id="__editor_container_div__">
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
                        plugins={this.plugins}
                        autoCorrect={false}
                        autoFocus={true}
                        placeholder="Write your note here.."
                        style={styles}
                        ref={editorRef => {
                            this.editorRef = editorRef;
                        }}
                    />
                </div>
            </Slide>
        );
    }
}
