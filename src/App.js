import './App.css';

import React, { Component } from 'react';

import { HotKeys } from 'react-hotkeys';
import { TEST_VIDEO_ID } from './utils';
import YoutubeIframeComponent from './YoutubeIframeComponent';
import ShowInstructionsComponent from './ShowInstructionsComponent';
import EditorComponent from './EditorComponent';
import LoadYoutubeVideoIdComponent from './LoadYoutubeVideoIdComponent';
import { Value } from 'slate';

const INVALID_VIDEO_TIME = -1;

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

/*
const YT_PLAYBACK_STATE_NAMES = {
    '-1': 'unstarted',
    1: 'playing',
    2: 'paused',
    3: 'buffering',
    5: 'cued',
};
*/

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
        console.log('playVideo', videoId);
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
        console.log('seekTo', timeInSeconds, 'seconds');
        this.playerApi.seekTo(timeInSeconds);
    }
}

const g_HotkeysOfCommands = {
    seekToTimeUnderCursor: 'alt+shift+a',
    saveToLocalStorage: 'alt+shift+s',
    loadFromLocalStorage: 'alt+shift+v',
};

const initialValue = Value.fromJSON({
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
                text: '...........................................................................',
              },
            ],
          },
        ],
      },
    ],
  },
});


// The commands from console are send via the App component
export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = { editorCommandToSend: undefined, editorValue: initialValue};

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.ytPlayerController = undefined;

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

    // TODO - perhaps break these into multiple functions instead of sending command objects, which
    // is a leftover from the previous style.
    doVideoCommand(command) {
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
        } else if (command.name === 'seekToTime') {
            if (!command.videoId || (!command.videoTime !== undefined && command.videoTime !== 0)) {
                // Check if currently playing videoId is the same as sent as command, if not we will
                // load the given video
                if (this.ytPlayerController.currentVideoId !== command.videoId) {
                    this.ytPlayerController.loadAndPlayVideo(command.videoId);
                }
                this.ytPlayerController.seekTo(command.videoTime);
            }

        } else {
            console.log('Received unknown command from editor', command);
        }
        return currentTime;
    }

    currentVideoInfo() {
        return {
            videoId: this.ytPlayerController.currentVideoId,
            videoTime: this.ytPlayerController.getCurrentTime(),
        };
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
                        parentApp={this}
                        editorCommand={this.state.editorCommandToSend}
                        getEditorRef={getEditorRef}
                        value={this.state.editorValue}
                    />
                </HotKeys>
            </div>
        );
    }
}
