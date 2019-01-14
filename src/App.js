import './App.css';

import {
    CompositeDecorator,
    convertToRaw,
    convertFromRaw,
    Editor as VanillaEditor,
    EditorState,
    Entity,
    Modifier,
    RichUtils,
    SelectionState,
} from 'draft-js';

import createMarkdownPlugin from 'draft-js-markdown-plugin';
import MarkdownEditor from 'draft-js-plugins-editor';
import React, { Component } from 'react';
import { HotKeys } from 'react-hotkeys';
import KEY_SEQUENCES from './keysequences';
import { Trie, TrieWalker, TRIE_WALKER_RESULT } from './trie';

const TEST_VIDEO_ID = '6orsmFndx_o';

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

// Appends given text to the editor
/*
function appendTextToEditor(editorState, text) {
    let selectionState = editorState.getSelection();

    if (!selectionState.isCollapsed()) {
        return editorState;
    }

    let currentContentState = editorState.getCurrentContent();
    let cursorOffsetInBlock = selectionState.getStartOffset();

    const blockKey = selectionState.getAnchorKey();

    const selBlockEnd = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: cursorOffsetInBlock,
        focusOffset: cursorOffsetInBlock,
        isBackward: false,
    });

    // Remove the character, update editor state.
    const newContent = Modifier.insertText(
        currentContentState,
        selBlockEnd,
        text
    );

    let newEditorState = EditorState.set(editorState, {
        currentContent: newContent,
    });

    newEditorState = EditorState.moveFocusToEnd(newEditorState);
    return newEditorState;
}
*/

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

    console.log('cursorOffsetInBlock = ', cursorOffsetInBlock);

    const blockKey = selectionState.getAnchorKey();

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

// --- Commands sent by the App to the YoutubeIframeComponent

function makePlayVideoCommand(appCallbackFn) {
    return {
        name: 'playVideo',
        time: 0,
        appCallbackFn: appCallbackFn,
    };
}

function makePauseVideoCommand(appCallbackFn) {
    return {
        name: 'pauseVideo',
        time: 0,
        appCallbackFn: appCallbackFn,
    };
}

function makeSeekToTimeCommand(time = 0, appCallbackFn) {
    return {
        name: 'seekToTime',
        time: time,
        appCallbackFn: appCallbackFn,
    };
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

const YT_PLAYBACK_STATE_NAMES = {
    '-1': 'unstarted',
    1: 'playing',
    2: 'paused',
    3: 'buffering',
    5: 'cued',
};

let g_youtubeLoadedPromise = undefined;

class YoutubeIframeComponent extends Component {
    constructor(props) {
        super(props);

        this.storedPlaybackState = 'unstarted';
        this.player = undefined; // The youtube iframe api is represented by this object
        this.refPlayer = undefined; // Will refer to the div in which the iframe will be created

        this.onPlayerStateChange = ytEvent => {
            this.storedPlaybackState = YT_PLAYBACK_STATE_NAMES[ytEvent.data];

            console.log(
                `YT playback state changed. New state = ${ytEvent.data} (${
                    this.storedPlaybackState
                })`
            );

            if (this.storedPlaybackState === 'ended') {
                this.props.onEnd(ytEvent);
            } else if (this.storedPlaybackState === 'playing') {
                this.props.onPlay(ytEvent);
            } else if (this.storedPlaybackState === 'paused') {
                this.props.onPause(ytEvent);
            } else if (this.storedPlaybackState === 'buffering') {
                this.props.onBuffer(ytEvent);
            } else if (this.storedPlaybackState === 'cued') {
                this.props.onCued(ytEvent);
            } else if (this.storedPlaybackState === 'unstarted') {
                this.props.onUnstarted(ytEvent);
            }
        };
    }

    render() {
        return (
            <div className="youtube-player">
                <div
                    ref={r => {
                        this.refPlayer = r;
                    }}
                />
            </div>
        );
    }

    componentDidMount() {
        if (!g_youtubeLoadedPromise) {
            g_youtubeLoadedPromise = new Promise((resolve, reject) => {
                // Create the element for Youtube API script and attach it to the HTML.
                const apiScriptElement = document.createElement('script');
                apiScriptElement.src = 'https://www.youtube.com/iframe_api';
                apiScriptElement.id = '__iframe_api__';

                // console.log('apiScriptElement = ', apiScriptElement);

                document.body.appendChild(apiScriptElement);

                // Pass the YT object as the result of the promise
                window.onYouTubeIframeAPIReady = () => resolve(window.YT);
            });

            g_youtubeLoadedPromise.then(YT => {
                console.log('YoutubePlayer ready');
                this.player = new YT.Player(this.refPlayer, {
                    videoId: TEST_VIDEO_ID,
                    height: '100%',
                    width: '100%',
                    events: {
                        onStateChange: this.onPlayerStateChange,
                    },
                });
                this.props.storeRefInParent(this.player);
                console.log('player = ', this.player);
            });
        }
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.destroy();
        }
    }

    componentWillReceiveProps(nextProps) {
        // Handle the video commands here.
        // console.log('Youtube Component will receive new props', nextProps);

        if (this.props.videoId !== nextProps.videoId && nextProps.videoId) {
            this.cueVideoId(nextProps.videoId);
        }

        let newPlaybackState = undefined;

        const command = nextProps.playerCommand;

        let seekToTime = -1;

        if (!command) {
            console.log('YoutubePlayer received undefined command.');
            return;
        }

        // Execute the command and put the current timestamp of the video.
        if (command.name === 'playVideo') {
            newPlaybackState = 'playing';
        } else if (command.name === 'pauseVideo') {
            newPlaybackState = 'paused';
        } else if (command.name === 'seekToTime') {
            newPlaybackState = 'playing';
            seekToTime = command.time;
        } else {
            console.log('Unknown command - ', command);
            newPlaybackState = 'playing';
        }

        if (!this.player || !this.player.getCurrentTime) {
            // Player api has not loaded yet
            if (command.appCallbackFn) {
                command.appCallbackFn();
            }

            console.log('YoutubePlayer api has not loaded yet');
            return;
        }

        command.time = this.player.getCurrentTime();

        console.log(
            'storedPlaybackState = ',
            this.storedPlaybackState,
            'newPlaybackState = ',
            newPlaybackState
        );

        if (
            (this.storedPlaybackState !== newPlaybackState && newPlaybackState) ||
            command.name === 'seekToTime'
        ) {
            this.updatePlaybackState(newPlaybackState, seekToTime, command.appCallbackFn);
        }
    }

    updatePlaybackState(newPlaybackState, seekToTime, appCallbackFn) {
        console.log('Updating playback state to ', newPlaybackState);
        if (newPlaybackState === 'playing') {
            if (seekToTime !== -1) {
                this.player.seekTo(seekToTime, true);
            } else {
                this.player.playVideo();
            }
        } else if (newPlaybackState === 'paused') {
            this.player.pauseVideo();
        } else if (newPlaybackState === 'unstarted') {
            this.player.stopVideo();
        } else {
            throw new Error(`Invalid new playback state "${newPlaybackState}"`);
        }

        if (appCallbackFn) {
            appCallbackFn();
        }
    }

    shouldComponentUpdate(newProps, newState) {
        return false;
    }
}

YoutubeIframeComponent.defaultProps = {
    onBuffer: ytEvent => {},

    onCued: ytEvent => {},

    onEnd: ytEvent => {},

    onError: ytEvent => {
        console.log('youtube iframe api error - ', ytEvent);
    },

    onPause: ytEvent => {},

    onPlay: ytEvent => {},

    onUnstarted: ytEvent => {},

    playbackState: 'unstarted',
    playerConfig: {},

    pauseVideo: (commandDesc, player) => {},
    playVideo: (commandDesc, player) => {},
    skipAhead: (commandDesc, player) => {},
    storeRefInParent: player => {},
};

// Just prints the current content blocks in the editor for debugging.
function printContentState(editorState, message = '') {
    console.log(message, convertToRaw(editorState.getCurrentContent()));
}

// Used as the strategy parameter of the CompositeDecorator we are using. Renders the LinkComponent
// for VIDEO_TIMESTAMP entities.
function findVideoTimestampEntities(contentBlock, callback) {
    // console.log('findEntityRanges');
    contentBlock.findEntityRanges(characterMetadata => {
        // console.log('Running on character ', characterMetadata);
        const entityKey = characterMetadata.getEntity();

        const result = entityKey !== null && Entity.get(entityKey).getType() === 'VIDEO_TIMESTAMP';

        if (result) {
            console.log('TRUE for this metadata', characterMetadata);
        }

        return result;
    }, callback);
}

const LinkComponent = props => {
    const { url } = Entity.get(props.entityKey).getData();

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

// The editor component.
class EditorComponent extends React.Component {
    constructor(props) {
        super(props);

        // Create the trie for the key sequences
        this.trie = new Trie();

        for (const sequence of Object.keys(KEY_SEQUENCES)) {
            this.trie.addSequence(sequence, KEY_SEQUENCES[sequence]);
        }

        this.trie.setDoneAddingSequences();
        this.trieWalker = new TrieWalker(this.trie);

        this.state = {
            editorState: EditorState.createEmpty(g_decorator),
            plugins: [createMarkdownPlugin()],
        };

        this.focus = () => this.refs.editor.focus();

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
            // If more than one chars are being input (pasted perhaps), we ignore previous character.
            if (chars.length > 1) {
                this.lastInputCharacter = '';
                return 'not-handled';
            }

            /*
            console.log(
                `handleBeforeInput... chars =  '${chars}', lastInputCharacter =  '${
                    this.lastInputCharacter
                }'`
            );
            */

            // return this._handleBeforeInput(chars, editorState, eventTimeStamp);

            // Add to the trie
            const c = chars;
            const trieResult = this.trieWalker.addNextChar(c);

            if (trieResult.name === TRIE_WALKER_RESULT.RESET) {
                this.lastInputCharacter = '';
            }

            if (trieResult.name === TRIE_WALKER_RESULT.CONTINUE) {
                this.lastInputCharacter = c;
            }

            if (trieResult.name === TRIE_WALKER_RESULT.MATCH) {
                this.lastInputCharacter = '';
                this._doCommandFromTrieResult(trieResult);
                return 'handled';
            }

            return 'not-handled';
        };

        this.handleReturn = (e, editorState) => {
            this._handleReturn(e, editorState);
        };
    }

    _doCommandFromTrieResult(trieResult) {
        const commandName = trieResult.mappedValue;
        console.assert(commandName !== undefined);

        let videoTime = 0;
        let shouldPutTimestamp = false;

        if (commandName === 'playVideo') {
            videoTime = this.props.app.notifyConsoleCommand({ name: 'playVideo' });
        } else if (commandName === 'pauseVideo') {
            videoTime = this.props.app.notifyConsoleCommand({ name: 'pauseVideo' });
        } else if (commandName === 'playVideoWithTimestamp') {
            videoTime = this.props.app.notifyConsoleCommand({ name: 'playVideo' });
            shouldPutTimestamp = true;
        } else if (commandName === 'pauseVideoWithTimestamp') {
            videoTime = this.props.app.notifyConsoleCommand({ name: 'pauseVideo' });
            shouldPutTimestamp = true;
        } else {
            console.log('Command -', commandName, 'not implemented yet');
            return;
        }

        let newEditorState = this.state.editorState;
        const selectionState = newEditorState.getSelection();
        const blockKey = selectionState.getAnchorKey();
        let currentContentState = newEditorState.getCurrentContent();
        let cursorOffsetInBlock = selectionState.getStartOffset();

        // Remove the text sequence from the editor.
        /*
        const selNCharsBack = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: cursorOffsetInBlock,
            focusOffset: cursorOffsetInBlock - (trieResult.stringLength - 1),
            isBackward: false,
        });
        */

        const N = trieResult.stringLength - 1;
        // ^ -1 because the last char is not put into the editor.
        console.log('N =', N);

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
    }

    _handleBeforeInput(singleChar, editorState, eventTimeStamp) {
        // Handle command based on the character after # and current mode
        if ('/>'.indexOf(singleChar) !== -1 && this.lastInputCharacter === '#') {
            return this._enterPoundKeyMode(singleChar, editorState);
        }

        this.lastInputCharacter = singleChar;
        return 'not-handled';
    }

    _handleReturn(e, editorState) {
        printContentState(editorState);
        return 'not-handled';
    }

    _enterPoundKeyMode(argChar, editorState) {
        console.log('_enterPoundKeyMode # command followed by', argChar);

        let newEditorState = editorState;

        let selectionState = editorState.getSelection();

        if (!selectionState.isCollapsed()) {
            return 'not-handled';
        }

        const blockKey = selectionState.getAnchorKey();
        let currentContentState = editorState.getCurrentContent();
        let cursorOffsetInBlock = selectionState.getStartOffset();

        let videoTime = 0;

        if (argChar === '/') {
            videoTime = this.props.app.notifyConsoleCommand({
                name: 'pauseVideo',
            });
        } else if (argChar === '>') {
            videoTime = this.props.app.notifyConsoleCommand({
                name: 'playVideo',
            });
        } else {
            console.warn('Should not reach here');
            return 'not-handled';
        }

        console.log(`Video time = ${videoTime}, ${secondsToHhmmss(videoTime)}`);

        // Create a selectionState range to include exactly the previous character '#' character.
        const selOneCharBack = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: cursorOffsetInBlock - 1,
            focusOffset: cursorOffsetInBlock,
            isBackward: false,
        });

        console.log('selOneCharBack = ', selOneCharBack);

        // Remove the preceding # character
        const newContent = Modifier.removeRange(currentContentState, selOneCharBack, 'forward');

        newEditorState = EditorState.set(editorState, {
            currentContent: newContent,
        });

        const selBeforeHash = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: cursorOffsetInBlock - 1,
            focusOffset: cursorOffsetInBlock - 1,
            isBackward: false,
        });

        newEditorState = EditorState.forceSelection(newEditorState, selBeforeHash);

        // Go to end
        // newEditorState = EditorState.moveFocusToEnd(newEditorState);

        // Append the timestamp link.
        newEditorState = insertVideoLinkAtCursor(
            newEditorState,
            secondsToHhmmss(videoTime),
            TEST_VIDEO_ID,
            videoTime
        );

        // Go to end.
        // newEditorState = EditorState.moveFocusToEnd(newEditorState);

        this.onChange(newEditorState);
        this.lastInputCharacter = '';
        return 'handled';
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
            editorCommand.appCallbackFn(convertToRaw(this.state.editorState.getCurrentContent()));
            return;
        } else if (editorCommand.name === 'setRawContentCommand') {
            console.log(
                'Creating new content from raw content',
                JSON.stringify(editorCommand.rawContent)
            );
            const newContentState = convertFromRaw(editorCommand.rawContent);

            const newEditorState = EditorState.set(this.state.editorState, {
                currentContent: newContentState,
            });
            this.onChange(newEditorState);
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

        // If the user changes block type before entering any text, we can either
        // style the placeholder or hide it. Let's just hide it now.

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
                <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType} />
                <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle} />
                <div className={editorDivClassName} onClick={this.focus}>
                    <VanillaEditor
                        blockStyleFn={getBlockStyle}
                        customStyleMap={styleMap}
                        editorState={editorState}
                        handleKeyCommand={this.handleKeyCommand}
                        onChange={this.onChange}
                        onTab={this.onTab}
                        ref="editor"
                        spellCheck={true}
                        handleBeforeInput={this.handleBeforeInput}
                        handleReturn={this.handleReturn}
                        plugins={this.state.plugins}
                    />
                </div>
            </div>
        );
        /* decorators={[g_decorator]} */
    }
}

// Custom overrides for "code" block-style
const styleMap = {
    CODE: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"SF Mono Regular", Inconsolata, monospace',
        fontSize: 16,
        padding: 2,
    },
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote':
            return 'console-editor-blockquote';
        default:
            return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = e => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'console-editor-styleButton';
        if (this.props.active) {
            className += ' console-editor-activeButton';
        }

        return (
            <span className={className} onMouseDown={this.onToggle}>
                {this.props.label}
            </span>
        );
    }
}

const BLOCK_TYPES = [
    { label: 'H1', style: 'header-one' },
    { label: 'H2', style: 'header-two' },
    { label: 'H3', style: 'header-three' },
    { label: 'H4', style: 'header-four' },
    { label: 'H5', style: 'header-five' },
    { label: 'H6', style: 'header-six' },
    { label: 'Blockquote', style: 'blockquote' },
    { label: 'UL', style: 'unordered-list-item' },
    { label: 'OL', style: 'ordered-list-item' },
    { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = props => {
    const { editorState } = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <div className="console-editor-controls">
            {BLOCK_TYPES.map(type => (
                <StyleButton
                    key={type.label}
                    active={type.style === blockType}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            ))}
        </div>
    );
};

const INLINE_STYLES = [
    { label: 'Bold', style: 'BOLD' },
    { label: 'Italic', style: 'ITALIC' },
    { label: 'Underline', style: 'UNDERLINE' },
    { label: 'Monospace', style: 'CODE' },
];

const InlineStyleControls = props => {
    let currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        <div className="console-editor-controls">
            {INLINE_STYLES.map(type => (
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            ))}
        </div>
    );
};

const g_HotkeysOfCommands = {
    seekToTimeUnderCursor: 'alt+shift+a',
    saveToLocalStorage: 'alt+shift+s',
    loadFromLocalStorage: 'alt+shift+v',
};

// The commands from console are send via the App component
export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            playerCommandToSend: undefined,
            editorCommandToSend: undefined,
        };

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.player = undefined;

        this.setPlayerRef = player => {
            this.player = player;
        };

        // Helpers to set the current editor or the player command to undefined
        this.unsetEditorCommand = () => {
            this.setState({ ...this.state, editorCommandToSend: undefined });
        };

        this.unsetPlayerCommand = () => {
            this.setState({ ...this.state, playerCommandToSend: undefined });
        };

        this.onHotkeySeekToTimeUnderCursor = event => {
            event.preventDefault();

            // Callback will send the player the seekToTime command and unset current editor
            // command.
            const callbackAfterEditorResponds = videoTime => {
                if (videoTime === INVALID_VIDEO_TIME) {
                    return;
                }

                let newState = {
                    ...this.state,
                    playerCommandToSend: makeSeekToTimeCommand(videoTime, this.unsetPlayerCommand),
                    editorCommandToSend: undefined,
                };

                this.setState(newState);
            };

            this.setState({
                ...this.state,
                editorCommandToSend: makeGetVideoTimeUnderCursorCommand(
                    callbackAfterEditorResponds
                ),
            });
        };

        this.onHotkeySaveToLocalStorage = event => {
            event.preventDefault();

            console.log('Saving to local storage');

            const callbackAfterEditorResponds = rawContent => {
                console.log('Raw content = ', rawContent);
                localStorage.setItem('lastSavedEditorState', JSON.stringify(rawContent));
                this.unsetEditorCommand();
            };

            this.setState({
                ...this.state,
                editorCommandToSend: makeGetRawContentCommand(callbackAfterEditorResponds),
            });
        };

        this.onHotkeyLoadFromLocalStorage = event => {
            event.preventDefault();
            const rawContent = JSON.parse(localStorage.getItem('lastSavedEditorState'));
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
    }

    // The sCU method will check if the new state has a command to send to at least one of the two
    // components. If so, it tells not to update. (Keeping it like this for now, although we don't
    // *need* to intervene)
    shouldComponentUpdate(newProps, newState) {
        if (
            newState.playerCommandToSend === undefined &&
            newState.editorCommandToSend === undefined
        ) {
            return false;
        }
        return true;
    }

    // Notify the command to the youtube player component. Returns the current time of the video.
    notifyConsoleCommand(consoleCommand) {
        if (consoleCommand.name === 'pauseVideo') {
            this.setState({
                playerCommandToSend: makePauseVideoCommand(this.unsetPlayerCommand),
            });
        } else if (consoleCommand.name === 'playVideo') {
            this.setState({
                playerCommandToSend: makePlayVideoCommand(this.unsetPlayerCommand),
            });
        } else if (consoleCommand.name === 'restartVideo') {
            this.setState({ playerCommandToSend: makeSeekToTimeCommand(0) });
        } else {
            console.log('Received unknown console command', consoleCommand);
        }

        if (!this.player || !this.player.getCurrentTime) {
            // Player has not loaded yet
            return INVALID_VIDEO_TIME;
        }

        return this.player.getCurrentTime();
    }

    render() {
        return (
            <div className="app">
                <HotKeys
                    keyMap={g_HotkeysOfCommands}
                    handlers={this.hotkeyHandlers}
                    className="hotkey-root"
                >
                    <YoutubeIframeComponent
                        app={this}
                        playerCommand={this.state.playerCommandToSend}
                        storeRefInParent={this.setPlayerRef}
                    />
                    <EditorComponent app={this} editorCommand={this.state.editorCommandToSend} />
                </HotKeys>
            </div>
        );
    }
}
