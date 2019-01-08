import React, { Component } from 'react';
import PropTypes from 'prop-types';
import YoutubePlayer from 'youtube-player';
import {
    Editor as VanillaEditor,
    EditorState,
    RichUtils,
    SelectionState,
    Modifier,
} from 'draft-js';

import MarkdownEditor from 'draft-js-plugins-editor';
import createMarkdownPlugin from 'draft-js-markdown-plugin';

import './App.css';

const TEST_VIDEO_ID = 'ANX_PxqZayU';

function secondsToHhmmss(seconds) {
    let remainingSeconds = seconds;
    let hours = 0;
    let minutes = 0;

    if (remainingSeconds > 3600) {
        hours = Math.floor(remainingSeconds / 3600);
        remainingSeconds = remainingSeconds % 3600;
    }

    if (remainingSeconds > 60) {
        minutes = Math.floor(remainingSeconds / 60);
        remainingSeconds = remainingSeconds % 60;
    }

    return `${hours}:${minutes}:${remainingSeconds}`;
}

// Appends given text to the editor
function appendTextToEditor(editorState, text) {
    let selectionState = editorState.getSelection();

    if (!selectionState.isCollapsed()) {
        return editorState;
    }

    let currentContent = editorState.getCurrentContent();
    let cursorOffsetInBlock = selectionState.getStartOffset();

    const blockKey = selectionState.getAnchorKey();

    // Create a selectionstate range to include exactly the previous character.

    const selOneCharBack = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: cursorOffsetInBlock,
        focusOffset: cursorOffsetInBlock,
        isBackward: false,
    });

    // Remove the character, update editor state.
    const newContent = Modifier.insertText(
        currentContent,
        selOneCharBack,
        text
    );

    let newEditorState = EditorState.set(editorState, {
        currentContent: newContent,
    });

    newEditorState = EditorState.moveFocusToEnd(newEditorState);
    return newEditorState;
}

// Commands send to the App by the editor.
function makePlayVideoCommand() {
    return {
        name: 'playVideo',
        time: 0,
    };
}

function makePauseVideoCommand() {
    return {
        name: 'pauseVideo',
        time: 0,
    };
}

function makeGotoTimeCommand(time = 0) {
    return {
        name: 'gotoTime',
        time: time,
    };
}

const YT_PLAYBACK_STATE_NAMES = {
    '-1': 'unstarted',
    1: 'playing',
    2: 'paused',
    3: 'buffering',
    5: 'cued',
};

class YoutubeIframeComponent extends Component {
    constructor(props) {
        super(props);

        console.log(this.props);

        this.player = undefined;
        this.refPlayer = undefined;
        this.storedPlaybackState = 'unstarted';

        window['onYouTubeIframeAPIReady'] = e => {
            this.YT = window['YT'];
            this.player = new window['YT'].Player('player', {
                videoId: TEST_VIDEO_ID,
                height: '100%',
                width: '100%',
            });
        };
    }

    getCurrentTime() {
        if (this.player) {
            return this.player.getCurrentTime();
        }
        console.warn('getCurrentTime called but player is undefined');
        return 0;
    }

    // Replace the DOM node with an iframe.
    componentDidMount() {
        // Get the player object
        this.player = YoutubePlayer(this.refPlayer, {
            videoId: TEST_VIDEO_ID,
            height: '100%',
            width: '100%',
        });
        this.props.storeRefInParent(this.player);
        this.registerYoutubeEventCallbacks();
    }

    componentWillUnmount() {
        this.player.destroy();
    }

    componentWillReceiveProps(nextProps) {
        // Handle the video commands here.
        console.log(
            'YoutubeIframeComponent just received new props',
            nextProps
        );
        this.diffstate(this.props, nextProps);
    }

    diffstate(curProps, nextProps) {
        if (curProps.videoId !== nextProps.videoId && nextProps.videoId) {
            this.cueVideoId(nextProps.videoId);
        }

        let newPlaybackState = undefined;

        const command = nextProps.latestCommand;

        // Execute the command and put the current timestamp of the video.
        if (command) {
            if (command.name === 'playVideo') {
                newPlaybackState = 'playing';
            } else if (command.name === 'pauseVideo') {
                newPlaybackState = 'paused';
            } else {
                console.log('Unknown command - ', command);
            }
            command.time = this.player.getCurrentTime();
        }

        if (this.storedPlaybackState !== newPlaybackState && newPlaybackState) {
            this.updatePlaybackState(newPlaybackState);
        }
    }

    updatePlaybackState(newPlaybackState) {
        if (newPlaybackState === 'playing') {
            this.player.playVideo();
        } else if (newPlaybackState === 'paused') {
            this.player.pauseVideo();
        } else if (newPlaybackState === 'unstarted') {
            this.player.stopVideo();
        } else {
            throw new Error(`Invalid new playback state "${newPlaybackState}"`);
        }
    }

    shouldComponentUpdate(newProps, newState) {
        return false;
    }

    registerYoutubeEventCallbacks() {
        this.player.on('stateChange', event => {
            this.storedPlaybackState = YT_PLAYBACK_STATE_NAMES[event.data];

            console.log(
                `YT playback state changed. New state = ${event.data} (${
                    this.storedPlaybackState
                })`
            );

            if (this.storedPlaybackState === 'ended') {
                this.props.onEnd(event);
            } else if (this.storedPlaybackState === 'playing') {
                this.props.onPlay(event);
            } else if (this.storedPlaybackState === 'paused') {
                this.props.onPause(event);
            } else if (this.storedPlaybackState === 'buffering') {
                this.props.onBuffer(event);
            } else if (this.storedPlaybackState === 'cued') {
                this.props.onCued(event);
            } else if (this.storedPlaybackState === 'unstarted') {
                this.props.onUnstarted(event);
            }
        });
    }

    render() {
        const style = { display: 'flex', width: '100%', height: '100%' };
        return (
            <div
                ref={domElement => {
                    this.refViewport = domElement;
                }}
                className="youtube-player"
            >
                <div
                    ref={domElement => {
                        this.refPlayer = domElement;
                    }}
                />
            </div>
        );
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
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    console.log(blockMap);

    console.log(
        message,
        `----------------- Current blocks (count = ${
            blockMap.size
        }) --------------------`
    );

    blockMap.forEach((blockData, blockId) => {
        const object = {
            id: blockId,
            data: blockData,
            style: blockData.getType(),
        };
        console.log(object);
    });
}

// The editor component.
class EditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editorState: EditorState.createEmpty(),
            plugins: [createMarkdownPlugin()],
        };

        this.focus = () => this.refs.editor.focus();

        this.onChange = editorState => {
            this.setState({ editorState });
        };

        this.handleKeyCommand = command => this._handleKeyCommand(command);
        this.onTab = e => this._onTab(e);
        this.toggleBlockType = type => this._toggleBlockType(type);
        this.toggleInlineStyle = style => this._toggleInlineStyle(style);

        this.lastInputCharacter = '';

        this.handleBeforeInput = (chars, editorState, eventTimeStamp) => {
            // If more than one chars are being input (pasted perhaps), we ignore previous character.
            if (chars.length > 1) {
                this.lastInputCharacter = '';
                return 'not-handled';
            }

            console.log(
                `handleBeforeInput... chars =  '${chars}', lastInputCharacter =  '${
                    this.lastInputCharacter
                }'`
            );

            return this._handleBeforeInput(chars, editorState, eventTimeStamp);
        };

        this.handleReturn = (e, editorState) => {
            this._handleReturn(e, editorState);
        };
    }

    _handleBeforeInput(singleChar, editorState, eventTimeStamp) {
        if (this._editorIsBlocked()) {
            return 'handled';
        }

        // Handle command based on the character after # and current mode
        if (
            '/>'.indexOf(singleChar) !== -1 &&
            this.lastInputCharacter === '#'
        ) {
            return this._enterPoundKeyMode(singleChar, editorState);
        }

        this.lastInputCharacter = singleChar;
        return 'not-handled';
    }

    _handleReturn(e, editorState) {
        printContentState(editorState);
        return 'not-handled';
    }

    _editorIsBlocked() {
        return this.props.isBlocked;
    }

    _enterPoundKeyMode(argChar, editorState) {
        console.log('# command followed by', argChar);

        let selectionState = editorState.getSelection();

        if (!selectionState.isCollapsed()) {
            return 'not-handled';
        }

        let videoTimePromise = 0;

        if (argChar === '/') {
            videoTimePromise = this.props.app.notifyConsoleCommand({
                name: 'pauseVideo',
            });
        } else if (argChar === '>') {
            videoTimePromise = this.props.app.notifyConsoleCommand({
                name: 'playVideo',
            });
        }

        // Resolve the time. @TODO: There should be a better way.

        videoTimePromise
            .then(videoTime => {
                console.log(
                    `Video time = ${videoTime}, ${secondsToHhmmss(videoTime)}`
                );

                const blockKey = selectionState.getAnchorKey();
                let currentContent = editorState.getCurrentContent();
                let cursorOffsetInBlock = selectionState.getStartOffset();

                console.log(`Removing prev char - cursorOffsetInBlock = ${cursorOffsetInBlock}, 
          anchorOffset = ${selectionState.getAnchorOffset()},
          focusOffset = ${selectionState.getFocusOffset()}`);

                // Create a selectionstate range to include exactly the previous character '#' character.
                const selOneCharBack = SelectionState.createEmpty(
                    blockKey
                ).merge({
                    anchorOffset: cursorOffsetInBlock - 1,
                    focusOffset: cursorOffsetInBlock,
                    isBackward: false,
                    hasFocus: true,
                });

                console.log('selOneCharBack = ', selOneCharBack);

                // Remove the character, update editor state.

                const newContent = Modifier.removeRange(
                    currentContent,
                    selOneCharBack,
                    'forward'
                );

                let newEditorState = EditorState.set(editorState, {
                    currentContent: newContent,
                });

                // printContentState(newEditorState, 'Before moving to end');

                newEditorState = EditorState.moveFocusToEnd(newEditorState);

                newEditorState = appendTextToEditor(
                    newEditorState,
                    secondsToHhmmss(videoTime)
                );

                // Insert timestamp

                // printContentState(newEditorState, 'After moving to end');

                this.onChange(newEditorState);
                this.lastInputCharacter = '';
                this.unblockEditor();
            })
            .catch(error => {
                console.warn(
                    'Error in resolving videoTimePromise',
                    JSON.stringify(error),
                    videoTimePromise
                );
            });

        return 'handled';
    }

    _handleKeyCommand(command) {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

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
        this.onChange(
            RichUtils.toggleBlockType(this.state.editorState, blockType)
        );
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
        );
    }

    render() {
        const { editorState } = this.state;

        // If the user changes block type before entering any text, we can either
        // style the placeholder or hide it. Let's just hide it now.

        let className = 'console-editor-editor';
        let contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (
                contentState
                    .getBlockMap()
                    .first()
                    .getType() !== 'unstyled'
            ) {
                className += ' console-editor-hidePlaceholder';
            }
        }

        return (
            <div className="console-editor-root">
                <BlockStyleControls
                    editorState={editorState}
                    onToggle={this.toggleBlockType}
                />
                <InlineStyleControls
                    editorState={editorState}
                    onToggle={this.toggleInlineStyle}
                />
                <div className={className} onClick={this.focus}>
                    <MarkdownEditor
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

// The commands from console are send via the App component. The player's response data, if relevant
// is also send to the console via the App component.

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            latestCommandToSend: undefined,
            editorBlocked: false,
        };

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.player = undefined;

        this.setPlayerRef = player => {
            this.player = player;
        };

        this.unblockEditor = () => {
            this.setState({
                latestCommandToSend: this.state.latestCommandToSend,
                editorBlocked: false,
            });
        };
    }

    // Notify the command to the youtube player component. Returns the current time of the video.
    notifyConsoleCommand(consoleCommand) {
        if (consoleCommand.name === 'pauseVideo') {
            this.setState({ latestCommandToSend: makePauseVideoCommand() });
        } else if (consoleCommand.name === 'playVideo') {
            this.setState({ latestCommandToSend: makePlayVideoCommand() });
        } else if (consoleCommand.name === 'restartVideo') {
            this.setState({ latestCommandToSend: makeGotoTimeCommand(0) });
        } else {
            console.log('Received unknown console command', consoleCommand);
        }

        let timePromise = this.player.getCurrentTime();

        console.log('timePromise = ', timePromise);

        this.setState({
            latestCommandToSend: this.state.latestCommandToSend,
            editorBlocked: false,
        });

        return timePromise;
    }

    render() {
        return (
            <div className="app">
                <YoutubeIframeComponent
                    app={this}
                    latestCommand={this.state.latestCommandToSend}
                    storeRefInParent={this.setPlayerRef}
                />
                <EditorComponent
                    app={this}
                    isBlocked={this.state.editorBlocked}
                    unblockEditor={this.unblockEditor}
                />
            </div>
        );
    }
}
