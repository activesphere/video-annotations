import './App.css';

import {
    CompositeDecorator,
    convertToRaw,
    Editor as VanillaEditor,
    EditorState,
    Entity,
    Modifier,
    RichUtils,
    SelectionState,
} from 'draft-js';
import createMarkdownPlugin from 'draft-js-markdown-plugin';
import MarkdownEditor from 'draft-js-plugins-editor';
import React, {Component} from 'react';

const TEST_VIDEO_ID = 'ANX_PxqZayU';

function secondsToHhmmss(seconds)
{
    let remainingSeconds = seconds;

    let hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds = remainingSeconds % 3600;

    let minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;

    return `${hours}:${minutes}:${remainingSeconds.toFixed(0)}`;
}

function makeYoutubeUrl(videoId, videoTimeInSeconds)
{
    // Seconds to mmss
    let remainingSeconds = videoTimeInSeconds;
    let minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;
    const mmss = `${minutes}m${remainingSeconds.toFixed(0)}s`;
    return `http://www.youtube.com/watch?v=${videoId}&t=${mmss}`;
}

// Appends given text to the editor
function appendTextToEditor(editorState, text)
{
    let selectionState = editorState.getSelection();

    if (!selectionState.isCollapsed()) {
        return editorState;
    }

    let currentContentState = editorState.getCurrentContent();
    let cursorOffsetInBlock = selectionState.getStartOffset();

    const blockKey = selectionState.getAnchorKey();

    const selBlockEnd = SelectionState.createEmpty(blockKey).merge({
        anchorOffset : cursorOffsetInBlock,
        focusOffset : cursorOffsetInBlock,
        isBackward : false,
    });

    // Remove the character, update editor state.
    const newContent = Modifier.insertText(currentContentState, selBlockEnd, text);

    let newEditorState = EditorState.set(editorState, {
        currentContent : newContent,
    });

    newEditorState = EditorState.moveFocusToEnd(newEditorState);
    return newEditorState;
}

function appendVideoLink(editorState, text, videoId, videoTime)
{
    let newEditorState = appendTextToEditor(editorState, text);

    const selectionState = newEditorState.getSelection();

    let currentContentState = newEditorState.getCurrentContent();
    let cursorOffsetInBlock = selectionState.getStartOffset();

    const blockKey = selectionState.getAnchorKey();

    const selInsertedCharacters = SelectionState.createEmpty(blockKey).merge({
        anchorOffset : cursorOffsetInBlock - text.length,
        focusOffset : cursorOffsetInBlock,
        isBackward : false,
    });

    console.log('selInsertedCharacters = ', selInsertedCharacters);

    const contentStateWithLinkEntity = currentContentState.createEntity('VIDEO_TIMESTAMP', 'MUTABLE', {
        url : makeYoutubeUrl(videoId, videoTime),
        videoId : videoId,
        videoTime : videoTime,
    });

    const linkEntityKey = contentStateWithLinkEntity.getLastCreatedEntityKey();

    newEditorState = EditorState.set(newEditorState, {
        currentContent : contentStateWithLinkEntity,
    });

    newEditorState = RichUtils.toggleLink(newEditorState, selInsertedCharacters, linkEntityKey);

    return newEditorState;
}

// Commands send to the App by the editor.
function makePlayVideoCommand()
{
    return {
        name : 'playVideo',
        time : 0,
    };
}

function makePauseVideoCommand()
{
    return {
        name : 'pauseVideo',
        time : 0,
    };
}

function makeGotoTimeCommand(time = 0)
{
    return {
        name : 'gotoTime',
        time : time,
    };
}

const YT_PLAYBACK_STATE_NAMES = {
    '-1' : 'unstarted',
    1 : 'playing',
    2 : 'paused',
    3 : 'buffering',
    5 : 'cued',
};

let g_youtubeLoadedPromise = undefined;

class YoutubeIframeComponent extends Component
{
    constructor(props)
    {
        super(props);

        this.storedPlaybackState = 'unstarted';
        this.player = undefined;    // The youtube iframe api is represented by this object
        this.refPlayer = undefined; // Will refer to the div in which the iframe will be created

        this.onPlayerStateChange = ytEvent => {
            this.storedPlaybackState = YT_PLAYBACK_STATE_NAMES[ytEvent.data];

            console.log(
                `YT playback state changed. New state = ${ytEvent.data} (${this.storedPlaybackState})`);

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

    render()
    {
        return (
            <div className="youtube-player">
                <div
                    ref={
            r => { this.refPlayer = r; }}
                />
            </div>
        );
    }

    componentDidMount()
    {
        if (!g_youtubeLoadedPromise) {
            g_youtubeLoadedPromise = new Promise((resolve, reject) => {
                // Create the element for Youtube API script and attach it to the HTML.
                const apiScriptElement = document.createElement('script');
                apiScriptElement.src = 'https://www.youtube.com/iframe_api';
                apiScriptElement.id = '__iframe_api__';

                console.log('apiScriptElement = ', apiScriptElement);

                document.body.appendChild(apiScriptElement);

                // Pass the YT object as the result of the promise
                window.onYouTubeIframeAPIReady = () => resolve(window.YT);
            });

            g_youtubeLoadedPromise.then(YT => {
                console.log('YoutubePlayer ready');
                this.player = new YT.Player(this.refPlayer, {
                    videoId : TEST_VIDEO_ID,
                    height : '100%',
                    width : '100%',
                    events : {
                        onStateChange : this.onPlayerStateChange,
                    },
                });
                this.props.storeRefInParent(this.player);
                console.log('player = ', this.player);
            });
        }
    }

    componentWillUnmount()
    {
        if (this.player) {
            this.player.destroy();
        }
    }

    componentWillReceiveProps(nextProps)
    {
        // Handle the video commands here.
        console.log('Youtube Component will receive new props', nextProps);

        if (this.props.videoId !== nextProps.videoId && nextProps.videoId) {
            this.cueVideoId(nextProps.videoId);
        }

        let newPlaybackState = undefined;

        const command = nextProps.latestCommand;

        console.log('latestCommand = ', command);

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

        console.log('storedPlaybackState = ', this.storedPlaybackState,
                    'newPlaybackState = ', newPlaybackState);

        if (this.storedPlaybackState !== newPlaybackState && newPlaybackState) {
            this.updatePlaybackState(newPlaybackState);
        }
    }

    updatePlaybackState(newPlaybackState)
    {
        console.log('Updating playback state to ', newPlaybackState);
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

    // Never re-render the youtube component. We just work with the playback once the component is
    // mounted.
    shouldComponentUpdate(newProps, newState) { return false; }
}

YoutubeIframeComponent.defaultProps = {
    onBuffer : ytEvent => {},

    onCued : ytEvent => {},

    onEnd : ytEvent => {},

    onError : ytEvent => { console.log('youtube iframe api error - ', ytEvent); },

    onPause : ytEvent => {},

    onPlay : ytEvent => {},

    onUnstarted : ytEvent => {},

    playbackState : 'unstarted',
    playerConfig : {},

    pauseVideo : (commandDesc, player) => {},
    playVideo : (commandDesc, player) => {},
    skipAhead : (commandDesc, player) => {},
    storeRefInParent : player => {},
};

// Just prints the current content blocks in the editor for debugging.
function printContentState(editorState, message = '')
{
    console.log(message, convertToRaw(editorState.getCurrentContent()));
}

let g_linkCount = 0;

// Used as the strategy paraemter of CompositeDecorator
function findVideoTimestampEntities(contentBlock, callback)
{
    console.log('findEntityRanges');
    contentBlock.findEntityRanges(characterMetadata => {
        console.log('Running on character ', characterMetadata);
        const entityKey = characterMetadata.getEntity();

        const result = entityKey !== null && Entity.get(entityKey).getType() == 'VIDEO_TIMESTAMP';

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

            /*
            console.log(
                `handleBeforeInput... chars =  '${chars}', lastInputCharacter =  '${
                    this.lastInputCharacter
                }'`
            );
            */

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
            '/>l'.indexOf(singleChar) !== -1 &&
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

        console.log(`Removing prev char - cursorOffsetInBlock = ${cursorOffsetInBlock}, 
          anchorOffset = ${selectionState.getAnchorOffset()},
          focusOffset = ${selectionState.getFocusOffset()}`);

        // Create a selectionState range to include exactly the previous character '#' character.
        const selOneCharBack = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: cursorOffsetInBlock - 1,
            focusOffset: cursorOffsetInBlock,
            isBackward: false,
            hasFocus: true,
        });

        console.log('selOneCharBack = ', selOneCharBack);

        // Remove the preceding # character
        const newContent = Modifier.removeRange(
            currentContentState,
            selOneCharBack,
            'forward'
        );

        newEditorState = EditorState.set(editorState, {
            currentContent: newContent,
        });

        // Go to end
        newEditorState = EditorState.moveFocusToEnd(newEditorState);

        /*
        newEditorState = appendTextToEditor(
            newEditorState,
            secondsToHhmmss(videoTime)
        );
        */

        // Append the timestamp link. TODO

        newEditorState = appendVideoLink(newEditorState, secondsToHhmmss(videoTime), TEST_VIDEO_ID, videoTime);

        // Go to end.
        newEditorState = EditorState.moveFocusToEnd(newEditorState);

        this.onChange(newEditorState);
        this.lastInputCharacter = '';
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
                        decorators={[g_decorator]}
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

// The commands from console are send via the App component
export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            latestCommandToSend: undefined,
        };

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.player = undefined;

        this.setPlayerRef = player => {
            this.player = player;
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

        return this.player.getCurrentTime();
    }

    render() {
        return (
            <div className="app">
                <YoutubeIframeComponent
                    app={this}
                    latestCommand={this.state.latestCommandToSend}
                    storeRefInParent={this.setPlayerRef}
                />
                <EditorComponent app={this} />
            </div>
        );
    }
}
