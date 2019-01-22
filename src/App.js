import './App.css';

import {
    CompositeDecorator,
    convertToRaw,
    convertFromRaw,
    Editor as VanillaEditor,
    EditorState,
    Modifier,
    RichUtils,
    SelectionState,
} from 'draft-js';

import createMarkdownPlugin from 'draft-js-markdown-plugin';
import MarkdownEditor from 'draft-js-plugins-editor';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { HotKeys } from 'react-hotkeys';
import KEY_SEQUENCES from './keysequences';
import { TEST_CONTENT_2 } from './test_raw_content';
import { Trie, TrieWalker, TRIE_WALKER_RESULT } from './trie';

const EditorToUse = MarkdownEditor;

const TEST_RAW_CONTENT = true;

const TEST_VIDEO_ID = '495nCzxM9PI';

const INVALID_VIDEO_TIME = -1;

function secondsToHhmmss(seconds) {
    let remainingSeconds = seconds;

    let hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds = remainingSeconds % 3600;

    let minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;

    return `${hours}:${minutes}:${remainingSeconds.toFixed(0)}`;
}

function makeYoutubeUrl(videoId, videoTimeInSeconds) {
    // Seconds to mmss
    let remainingSeconds = videoTimeInSeconds;
    let minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;
    const mmss = `${minutes}m${remainingSeconds.toFixed(0)}s`;
    return `http://www.youtube.com/watch?v=${videoId}&t=${mmss}`;
}

function insertVideoLinkAtCursor(editorState, text, videoId, videoTime) {
    console.log('Inserting video link');
    let newEditorState = editorState;

    const selectionState = newEditorState.getSelection();

    if (!selectionState.isCollapsed()) {
        return newEditorState;
    }

    // Insert the text
    let newContentState = newEditorState.getCurrentContent();
    const cursorOffsetInBlock = selectionState.getStartOffset();
    const blockKey = selectionState.getAnchorKey();

    console.log(
        'blockKey of the block in which to put the link = ',
        blockKey,
        'cursorOffsetInBlock = ',
        cursorOffsetInBlock
    );

    const selAtCursor = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: cursorOffsetInBlock,
        focusOffset: cursorOffsetInBlock,
        isBackward: false,
    });

    newContentState = Modifier.insertText(newContentState, selAtCursor, text);

    newEditorState = EditorState.set(newEditorState, {
        currentContent: newContentState,
    });

    // Add entity link

    const selInsertedCharacters = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: cursorOffsetInBlock,
        focusOffset: cursorOffsetInBlock + text.length,
        isBackward: false,
    });

    newContentState = newContentState.createEntity('VIDEO_TIMESTAMP', 'MUTABLE', {
        url: makeYoutubeUrl(videoId, videoTime),
        videoId: videoId,
        videoTime: videoTime,
    });

    const linkEntityKey = newContentState.getLastCreatedEntityKey();

    newEditorState = EditorState.set(newEditorState, {
        currentContent: newContentState,
    });

    newEditorState = RichUtils.toggleLink(newEditorState, selInsertedCharacters, linkEntityKey);

    // Move cursor to end of the inserted text

    const selEndOfInsertedChars = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: cursorOffsetInBlock + text.length,
        focusOffset: cursorOffsetInBlock + text.length,
        isBackward: false,
    });

    newEditorState = EditorState.forceSelection(newEditorState, selEndOfInsertedChars);

    return newEditorState;
}

// --- Commands sent by App to EditorComponent

function makeGetVideoTimeUnderCursorCommand(appCallbackFn) {
    return { name: 'getVideoTimeUnderCursor', appCallbackFn: appCallbackFn };
}

function makeGetRawContentCommand(appCallbackFn) {
    return { name: 'getRawContentCommand', appCallbackFn: appCallbackFn };
}

function makeSetRawContentCommand(rawContent, appCallbackFn) {
    return {
        name: 'setRawContentCommand',
        rawContent: rawContent,
        appCallbackFn: appCallbackFn,
    };
}

class YoutubeIframeComponent extends Component {
    static propTypes = {
        // (refToPlayerDiv) => void
        getYtPlayerApiCallback: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.refToPlayerDiv = undefined;
        this.ytPlayerApiLoadedPromise = undefined;
    }

    shouldComponentUpdate(newProps, newState) {
        return false;
    }

    render() {
        return (
            <div className="youtube-player">
                <div
                    ref={refToPlayerDiv => {
                        this.refToPlayerDiv = refToPlayerDiv;
                    }}
                />
            </div>
        );
    }

    // In cDM we load the youtube api.
    componentDidMount() {
        if (!this.ytPlayerApiLoadedPromise) {
            let loadedYtPlayerApi = false;

            this.ytPlayerApiLoadedPromise = new Promise((resolve, reject) => {
                // Create the element for Youtube API script and attach it to the HTML.
                const apiScriptElement = document.createElement('script');
                apiScriptElement.src = 'https://www.youtube.com/iframe_api';
                apiScriptElement.id = '__iframe_api__';

                document.body.appendChild(apiScriptElement);

                // Pass the YT object as the result of the promise
                window.onYouTubeIframeAPIReady = () => {
                    resolve({
                        YT: window.YT,
                        refToPlayerDiv: this.refToPlayerDiv,
                    });

                    loadedYtPlayerApi = true;
                };
            });

            this.ytPlayerApiLoadedPromise.then(this.props.getYtPlayerApiCallback);

            // If youtube api doesn't load within 4 seconds, we freaking crash x_). For now.
            const timeoutPromise = new Promise((resolve, reject) => {
                const timeoutSeconds = 10;
                setTimeout(() => {
                    if (!loadedYtPlayerApi) {
                        console.assert(
                            false,
                            `Failed to load youtube player api in ${timeoutSeconds} seconds`
                        );
                    }
                }, timeoutSeconds * 1000);
            });

            Promise.race([timeoutPromise, this.ytPlayerApiLoadedPromise]);
        }
    }
}

// Just prints the current content blocks in the editor for debugging.
function printContentState(editorState, message = '') {
    console.log(message, convertToRaw(editorState.getCurrentContent()));
}

// Used as the strategy parameter of the CompositeDecorator we are using. Renders the LinkComponent
// for VIDEO_TIMESTAMP entities.
function findVideoTimestampEntities(contentBlock, callback, contentState) {
    // console.log('findEntityRanges');
    contentBlock.findEntityRanges(characterMetadata => {
        // console.log('Running on character ', characterMetadata);
        const entityKey = characterMetadata.getEntity();

        const result =
            entityKey !== null && contentState.getEntity(entityKey).getType() === 'VIDEO_TIMESTAMP';

        if (result) {
            console.log('TRUE for this metadata', characterMetadata);
        }

        return result;
    }, callback);
}

const LinkComponent = props => {
    const entityKey = props.entityKey;

    let { url } = props.contentState.getEntity(entityKey).getData();

    if (!url) {
        url = '';
    }

    return (
        <a href={url} className="console-editor-link">
            {props.children}
        </a>
    );
};

const g_decorator = new CompositeDecorator([
    {
        strategy: findVideoTimestampEntities,
        component: LinkComponent,
    },
]);

function createEmptyEditorState() {
    let editorState = undefined;
    if (EditorToUse === MarkdownEditor) {
        editorState = EditorState.createEmpty();
    } else {
        editorState = EditorState.createEmpty(g_decorator);
    }

    return editorState;
}

// The editor component. Exported for testing.
class EditorComponent extends React.Component {
    constructor(props) {
        super(props);

        // Keeping a ref to the editor (which is a contenteditable in DOM, just saying)
        this.editorRef = undefined;

        // Create the trie for the key sequences
        this.trie = new Trie();

        for (const sequence of Object.keys(KEY_SEQUENCES)) {
            this.trie.addSequence(sequence, KEY_SEQUENCES[sequence]);
        }

        this.trie.setDoneAddingSequences();
        this.trieWalker = new TrieWalker(this.trie);

        this.state = {
            editorState: createEmptyEditorState(),
            plugins: [createMarkdownPlugin()],
        };

        this.focus = () => this.editorRef.focus();

        this.onChange = editorState => {
            /*
            const sel = editorState.getSelection();

            if (sel.isCollapsed()) {
                console.log(
                    'Selection collapsed, cursor =',
                    sel.getStartOffset()
                );
            } else {
                console.log(
                    `Selection start = ${sel.getStartOffset()} end = ${sel.getEndOffset()}, isBackward = ${sel.getIsBackward()}`
                );
            }
            */

            this.setState({ editorState });
        };

        this.handleKeyCommand = command => this._handleKeyCommand(command);
        this.onTab = e => this._onTab(e);
        this.toggleBlockType = type => this._toggleBlockType(type);
        this.toggleInlineStyle = style => this._toggleInlineStyle(style);

        this.lastInputCharacter = ''; // TODO: stop maintaining this variable once we use the trie.

        this.handleBeforeInput = (chars, editorState, eventTimeStamp) => {
            // If app is not in props, it means we are testing.

            if (!this.props.app) {
                return 'not-handled';
            }

            // If more than one chars are being input (pasted perhaps), we ignore previous character.
            if (chars.length > 1) {
                this.lastInputCharacter = '';
                return 'not-handled';
            }

            // Add to the trie
            const c = chars;
            const trieResult = this.trieWalker.addNextChar(c);

            // console.log('trieResult =', trieResult);

            if (trieResult.name === TRIE_WALKER_RESULT.RESET) {
                this.lastInputCharacter = '';
            }

            if (trieResult.name === TRIE_WALKER_RESULT.CONTINUE) {
                this.lastInputCharacter = c;
            }

            if (trieResult.name === TRIE_WALKER_RESULT.MATCH) {
                this.lastInputCharacter = '';
                return this._doCommandFromTrieResult(trieResult);
            }

            return 'not-handled';
        };

        this.handleReturn = (e, editorState) => {
            this._handleReturn(e, editorState);
        };

        if (TEST_RAW_CONTENT) {
            console.log('Loading raw content');
            const newContentState = convertFromRaw(TEST_CONTENT_2);
            const newEditorState = EditorState.set(this.state.editorState, {
                currentContent: newContentState,
            });
            this.state.editorState = newEditorState;
        }
    }

    _doCommandFromTrieResult(trieResult) {
        const commandName = trieResult.mappedValue;
        console.assert(commandName !== undefined);

        let videoTime = 0;
        let shouldPutTimestamp = false;

        // Send the app component the appropriate command using sendCommandFromEditorToPlayer.

        if (commandName === 'playVideo') {
            videoTime = this.props.app.sendCommandFromEditorToPlayer({ name: 'playVideo' });
        } else if (commandName === 'pauseVideo') {
            videoTime = this.props.app.sendCommandFromEditorToPlayer({ name: 'pauseVideo' });
        } else if (commandName === 'playVideoWithTimestamp') {
            videoTime = this.props.app.sendCommandFromEditorToPlayer({ name: 'playVideo' });
            shouldPutTimestamp = true;
        } else if (commandName === 'pauseVideoWithTimestamp') {
            videoTime = this.props.app.sendCommandFromEditorToPlayer({ name: 'pauseVideo' });
            shouldPutTimestamp = true;
        } else if (commandName === 'seekForwardNSeconds') {
            const seconds = trieResult.repeatCounts['>'];
            if (!seconds || seconds <= 0) {
                console.warn('Should not happen, seconds = ', seconds);
                return 'not-handled';
            }
            this.props.app.sendCommandFromEditorToPlayer({
                name: 'addToCurrentTime',
                secondsToAdd: seconds,
            });
        } else if (commandName === 'seekBackwardNSeconds') {
            const seconds = trieResult.repeatCounts['<'];
            if (!seconds || seconds <= 0) {
                console.warn('Should not happen, seconds = ', seconds);
                return 'not-handled';
            }
            this.props.app.sendCommandFromEditorToPlayer({
                name: 'addToCurrentTime',
                secondsToAdd: -seconds,
            });
        } else {
            console.log('Command -', commandName, 'not implemented yet');
            return 'not-handled';
        }

        let newEditorState = this.state.editorState;
        const selectionState = newEditorState.getSelection();
        const blockKey = selectionState.getAnchorKey();
        let currentContentState = newEditorState.getCurrentContent();
        let cursorOffsetInBlock = selectionState.getStartOffset();

        // Remove the text sequence from the editor.

        const N = trieResult.stringLength - 1;
        // ^ -1 because the last char is not put into the editor. console.log('N =', N);

        const selNCharsBack = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: cursorOffsetInBlock - N,
            focusOffset: cursorOffsetInBlock,
            isBackward: false,
        });

        const newContentState = Modifier.removeRange(currentContentState, selNCharsBack, 'forward');

        newEditorState = EditorState.set(newEditorState, {
            currentContent: newContentState,
        });

        // Position the cursor right at the beginning of the (now-deleted) sequence.
        const selAtSequenceBegin = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: cursorOffsetInBlock - N,
            focusOffset: cursorOffsetInBlock - N,
            isBackward: false,
        });

        newEditorState = EditorState.forceSelection(newEditorState, selAtSequenceBegin);

        if (shouldPutTimestamp) {
            console.log('Should put timestamp');
            // Append the timestamp link.
            newEditorState = insertVideoLinkAtCursor(
                newEditorState,
                secondsToHhmmss(videoTime),
                TEST_VIDEO_ID,
                videoTime
            );
        }

        this.onChange(newEditorState);
        return 'handled';
    }

    _handleReturn(e, editorState) {
        printContentState(editorState);
        return 'not-handled';
    }

    _handleKeyCommand(command) {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        // All key commands will reset the key sequence trie. Simple to handle.
        this.trieWalker.resetManually();

        if (newState) {
            this.onChange(newState);
            return 'handled';
        }

        return 'not-handled';
    }

    _onTab(e) {
        const maxDepth = 4;
        this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
    }

    _toggleBlockType(blockType) {
        this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle));
    }

    componentWillReceiveProps(newProps) {
        if (!newProps.editorCommand) {
            console.log('newProps.editorCommand was undefined, not doing anything');
            return;
        }

        this._executeEditorCommand(newProps.editorCommand);
    }

    _executeEditorCommand(editorCommand) {
        this.trieWalker.resetManually();

        console.log('_executeEditorCommand', editorCommand);

        if (editorCommand.name === 'getVideoTimeUnderCursor') {
            const videoTimeUnderCursor = this._getVideoTimeUnderCursor();

            if (videoTimeUnderCursor < 0) {
                console.log('Cursor not above a VIDEO_TIMESTAMP entity');
                editorCommand.appCallbackFn(-1);
            } else {
                console.log('Cursor IS above a VIDEO_TIMESTAMP entity');
                editorCommand.appCallbackFn(videoTimeUnderCursor);
            }

            return;
        } else if (editorCommand.name === 'getRawContentCommand') {
            const dirMap = this.state.editorState.getDirectionMap();
            console.log('direction map =', dirMap);
            editorCommand.appCallbackFn(convertToRaw(this.state.editorState.getCurrentContent()));
            return;
        } else if (editorCommand.name === 'setRawContentCommand') {
            console.log(
                'Creating new content from raw content',
                JSON.stringify(editorCommand.rawContent)
            );

            const newContentState = convertFromRaw(editorCommand.rawContent);

            // Create a new editor state and then set the loaded content state.
            // let newEditorState = this.state.editorState;

            let newEditorState = createEmptyEditorState();
            newEditorState = EditorState.set(newEditorState, { currentContent: newContentState });

            newEditorState = EditorState.moveFocusToEnd(newEditorState);
            this.onChange(newEditorState);

            if (editorCommand.appCallbackFn) {
                editorCommand.appCallbackFn();
            }

            return;
        }

        console.warn('Unknown command -', editorCommand);
    }

    _getVideoTimeUnderCursor() {
        let editorState = this.state.editorState;
        const selectionState = editorState.getSelection();

        if (!selectionState.isCollapsed()) {
            return INVALID_VIDEO_TIME;
        }

        // Get the block under the cursor
        const blockKey = selectionState.getAnchorKey();
        const contentState = editorState.getCurrentContent();
        const block = contentState.getBlockForKey(blockKey);

        // Find the VIDEO_TIMESTAMP entity in the block
        const entityKey = block.getEntityAt(selectionState.getStartOffset());

        // console.log('Found entity under cursor - entityKey ', entityKey);

        if (entityKey === null) {
            return INVALID_VIDEO_TIME;
        }

        const entity = contentState.getEntity(entityKey);
        console.log('Entity =', entity);

        if (entity.getType() === 'VIDEO_TIMESTAMP') {
            const { videoTime } = entity.getData();
            return videoTime;
        }

        return INVALID_VIDEO_TIME;
    }

    render() {
        const { editorState } = this.state;

        // If the user changes block type before entering any text, we can either style the
        // placeholder or hide it. Let's just hide it now.

        let editorDivClassName = 'console-editor-editor';
        let contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (
                contentState
                    .getBlockMap()
                    .first()
                    .getType() !== 'unstyled'
            ) {
                editorDivClassName += ' console-editor-hidePlaceholder';
            }
        }

        return (
            <div className="console-editor-root">
                <div className={editorDivClassName} onClick={this.focus}>
                    <EditorToUse
                        editorState={editorState}
                        textAlignment={'left'}
                        handleKeyCommand={this.handleKeyCommand}
                        onChange={this.onChange}
                        onTab={this.onTab}
                        ref={editorRef => {
                            if (this.props.getEditorRef) {
                                this.props.getEditorRef(editorRef);
                            }
                            this.editorRef = editorRef;
                        }}
                        spellCheck={true}
                        handleBeforeInput={this.handleBeforeInput}
                        handleReturn={this.handleReturn}
                        plugins={this.state.plugins}
                        decorators={[g_decorator]}
                    />
                </div>
            </div>
        );
    }
}

const ShowInstructionsComponent = props => {
    const keySequenceInfoText = `
        Default key sequences for controlling video
        ===========================================

        # >                         Play Video,
        # /                         Pause Video,
        # t >                       Place Timestamp and Play video
        # t /                       Place Timestamp and Pause video
        # [some number of <'s] g    Seek back N seconds where N = number of '<'
        # [some number of >'s] g    Similarly seek forward N seconds
    `;

    console.log('keySequenceInfoText =', keySequenceInfoText);

    const infoText = props.infoText ? props.infoText : keySequenceInfoText;

    return (
        <div className="info-text">
            <p id="__info_text__">{infoText}</p>
        </div>
    );
};

class LoadYoutubeVideoIdComponent extends Component {
    static propTypes = {
        locked: PropTypes.bool,
        focussed: PropTypes.bool,
        value: PropTypes.string,
        error: PropTypes.string,
        label: PropTypes.string,
        onChange: PropTypes.func,
        onSubmit: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            focussed: (props.locked && props.focussed) || false,
            value: props.value ? props.value : '',
            error: props.error ? props.error : '',
            label: props.label ? props.label : 'Video ID',
        };

        this.handleChange = event => {
            const value = event.target.value;
            this.setState({ ...this.state, value, error: '' });

            if (this.props.onChange) {
                return this.props.onChange(value);
            }
        };

        this.handleSubmit = event => {
            event.preventDefault();
            // this.setState({ ...this.state, value, error: '' });
            return this.props.onSubmit(this.state.value);
        };
    }

    render() {
        const { value, label } = this.state;

        return (
            <div className="youtube-id-input">
                <form onSubmit={this.handleSubmit}>
                    <input
                        id="__yt_video_id_input__"
                        type="text"
                        value={value}
                        placeholder={label}
                        onChange={this.handleChange}
                        spellCheck="false"
                    />
                </form>
            </div>
        );
    }
}

const YT_PLAYBACK_STATE_NAMES = {
    '-1': 'unstarted',
    1: 'playing',
    2: 'paused',
    3: 'buffering',
    5: 'cued',
};

class YoutubePlayerController {
    constructor(playerApi) {
        console.assert(playerApi !== undefined);
        this.playerApi = playerApi;
        // this.currentVideoId = '';
        this.currentVideoId = TEST_VIDEO_ID;
    }

    getPlayerState() {
        return this.playerApi.getPlayerState();
    }

    playVideo(videoId = undefined) {
        if (!videoId && !this.currentVideoId) {
            return;
        }

        this.currentVideoId = videoId ? videoId : this.currentVideoId;
        // this.playerApi.cueVideoById(this.currentVideoId, 0);

        console.log('playVideo', this.currentVideoId);
        this.playerApi.playVideo(this.currentVideoId);
    }

    loadAndPlayVideo(videoId) {
        this.currentVideoId = videoId;
        this.playerApi.cueVideoById(this.currentVideoId, 0);
        this.playerApi.playVideo(this.currentVideoId);
    }

    pauseVideo() {
        this.playerApi.pauseVideo(this.currentVideoId);
    }

    addToCurrentTime(seconds) {
        const currentTime = this.playerApi.getCurrentTime();
        this.playerApi.seekTo(Math.max(currentTime + seconds, 0));
    }

    getCurrentTime() {
        return this.playerApi.getCurrentTime();
    }

    seekTo(timeInSeconds) {
        this.playerApi.seekTo(timeInSeconds);
    }
}

const g_HotkeysOfCommands = {
    seekToTimeUnderCursor: 'alt+shift+a',
    saveToLocalStorage: 'alt+shift+s',
    loadFromLocalStorage: 'alt+shift+v',
};

// The commands from console are send via the App component
export class App extends Component {
    constructor(props) {
        super(props);
        this.state = { editorCommandToSend: undefined };

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.ytPlayerController = undefined;

        this.editorRef = undefined;

        // Helpers to set the current editor or the player command to undefined
        this.unsetEditorCommand = () => {
            this.setState({ ...this.state, editorCommandToSend: undefined });
        };

        this.onHotkeySeekToTimeUnderCursor = event => {
            event.preventDefault();

            this.setState({
                ...this.state,
                editorCommandToSend: makeGetVideoTimeUnderCursorCommand(videoTime => {
                    if (videoTime !== INVALID_VIDEO_TIME) {
                        this.ytPlayerController.seekTo(videoTime);
                    }
                    this.unsetEditorCommand();
                }),
            });
        };

        this.onHotkeySaveToLocalStorage = event => {
            event.preventDefault();

            console.log('Saving to local storage');

            const callbackAfterEditorResponds = rawContent => {
                console.log('Raw content = ', rawContent);
                const savedContentString = JSON.stringify(rawContent);
                console.log(`Saved content =${savedContentString}`);
                sessionStorage.setItem('lastSavedEditorState', savedContentString);
                this.unsetEditorCommand();
            };

            this.setState({
                ...this.state,
                editorCommandToSend: makeGetRawContentCommand(callbackAfterEditorResponds),
            });
        };

        this.onHotkeyLoadFromLocalStorage = event => {
            event.preventDefault();
            const rawContent = JSON.parse(sessionStorage.getItem('lastSavedEditorState'));
            console.log('Loaded editor contents from local storage', rawContent);

            this.setState({
                ...this.state,
                editorCommandToSend: makeSetRawContentCommand(rawContent, () => {
                    this.unsetEditorCommand();
                }),
            });
        };

        // Initializing the hotkey handler map

        this.hotkeyHandlers = {};

        this.hotkeyHandlers['seekToTimeUnderCursor'] = this.onHotkeySeekToTimeUnderCursor;
        this.hotkeyHandlers['saveToLocalStorage'] = this.onHotkeySaveToLocalStorage;
        this.hotkeyHandlers['loadFromLocalStorage'] = this.onHotkeyLoadFromLocalStorage;

        // Callback for "load new video" will be sent to LoadYoutubeVideoIdComponent
        this.loadNewVideoCallback = videoId => {};
    }

    sendCommandFromEditorToPlayer(command) {
        console.assert(this.ytPlayerController !== undefined);
        const currentTime = this.ytPlayerController.getCurrentTime();
        if (command.name === 'pauseVideo') {
            this.ytPlayerController.pauseVideo();
        } else if (command.name === 'playVideo') {
            this.ytPlayerController.playVideo();
        } else if (command.name === 'restartVideo') {
            this.ytPlayerController.seekTo(0);
        } else if (command.name === 'addToCurrentTime') {
            this.ytPlayerController.addToCurrentTime(command.secondsToAdd);
        } else {
            console.log('Received unknown command from editor', command);
        }
        return currentTime;
    }

    render() {
        const getYtPlayerApiCallback = ({ YT, refToPlayerDiv }) => {
            const ytPlayerApi = new YT.Player(refToPlayerDiv, {
                videoId: TEST_VIDEO_ID,
                height: '100%',
                width: '100%',
                events: {
                    onStateChange: this.onPlayerStateChange,
                },
            });
            this.ytPlayerController = new YoutubePlayerController(ytPlayerApi);
        };

        const onVideoIdInput = inputString => {
            console.log('onVideoIdInput called with videoId', inputString);

            if (!inputString) {
                return;
            }

            const videoId = inputString.trim();
            console.log('Cueing video ', videoId);
            this.ytPlayerController.loadAndPlayVideo(videoId);
            this.editorRef.focus();
        };

        const getEditorRef = editorRef => {
            this.editorRef = editorRef;
        };

        return (
            <div className="app">
                <HotKeys
                    keyMap={g_HotkeysOfCommands}
                    handlers={this.hotkeyHandlers}
                    className="hotkey-root"
                >
                    <div className="left-panel">
                        <LoadYoutubeVideoIdComponent onSubmit={onVideoIdInput} />
                        <YoutubeIframeComponent getYtPlayerApiCallback={getYtPlayerApiCallback} />
                        <ShowInstructionsComponent />
                    </div>

                    <EditorComponent
                        app={this}
                        editorCommand={this.state.editorCommandToSend}
                        getEditorRef={getEditorRef}
                    />
                </HotKeys>
            </div>
        );
    }
}
