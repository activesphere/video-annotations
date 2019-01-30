import './App.css';

import React, { Component } from 'react';
import Select from 'react-select';

import { TEST_VIDEO_ID, GIGANTOR_THEME_SONG } from './utils';
import YoutubeIframeComponent from './YoutubeIframeComponent';
import LogComponent, { defaultInfoText } from './LogComponent';
import EditorComponent from './EditorComponent';
import LoadYoutubeVideoIdComponent from './LoadYoutubeVideoIdComponent';
import axios from 'axios';
import getYoutubeTitle from 'get-youtube-title';

const YOUTUBE_API_KEY = 'AIzaSyB0Hslfl-deOx-ApFvTE0osjJCy2T_1uL0';

// Muh test modal
// import { NewbModal, SearchNotesMenuModal } from './ModalTutorial';

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
    constructor(YT, playerApi) {
        console.assert(playerApi !== undefined);
        this.YT = YT;
        this.playerApi = playerApi;
        // this.currentVideoId = '';
        // this.currentVideoId = TEST_VIDEO_ID;
        this.currentVideoId = undefined;
        this.currentVideoTitle = undefined;

        /* TODO(rksht) - Without going through this, it's better to just get the video name using Youtube's
        Data API.
        const onStateChange = e => {
        	console.log('player state change - e.data =', e.data);
            switch (e.data) {
                case this.YT.PlayerState.UNSTARTED:
                    break;

                default:
                    if (!this.currentVideoTitle) {
                        this.currentVideoTitle = this.player.getVideoData().title;
                        console.log('currentVideoTitle =', this.currentVideoTitle);
                    }
                    break;
            }
        };

        this.playerApi.addEventListener('onStateChange', this.onStateChange);
        */
    }

    setVideoTitle() {
        if (this.currentVideoId === undefined) {
            this.currentVideoTitle = undefined;
            return;
        }

        const videoTitleWhenIssued = this.currentVideoId;

        // prettier-ignore
        // const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${this.currentVideoId}&key=${YOUTUBE_API_KEY}`;

        getYoutubeTitle(this.currentVideoId, YOUTUBE_API_KEY, (err, title) => {
        	console.log("Title = ", title, "Error =", err);
        });
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
        this.setVideoTitle();
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

const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' },
];

// The commands from console are send via the App component
export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editorCommand: undefined,
            infoText: undefined,
            infoLastTime: undefined,
            selectedOption: undefined,
        };

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.ytPlayerController = undefined;

        /*
        setTimeout(() => {
            this.ytPlayerController.loadAndPlayVideo(TEST_VIDEO_ID);
        }, 3 * 1000);
        */
    }

    // TODO(rksht) - perhaps break these into multiple functions instead of sending command objects,
    // which is a leftover from the previous style.
    doVideoCommand(command) {
        console.assert(this.ytPlayerController !== undefined);
        const currentTime = this.ytPlayerController.getCurrentTime();

        switch (command.name) {
            case 'playVideo':
                this.ytPlayerController.playVideo();
                break;

            case 'pauseVideo':
                this.ytPlayerController.pauseVideo();
                break;

            case 'restartVideo':
                this.ytPlayerController.seekTo(0);
                break;

            case 'addToCurrentTime':
                this.ytPlayerController.addToCurrentTime(command.secondsToAdd);
                break;

            case 'seekToTime':
                if (
                    !command.videoId ||
                    (!command.videoTime !== undefined && command.videoTime !== 0)
                ) {
                    // Check if currently playing videoId is the same as sent as command, if not we
                    // will load the given video
                    if (this.ytPlayerController.currentVideoId !== command.videoId) {
                        this.ytPlayerController.loadAndPlayVideo(command.videoId);
                    }
                    this.ytPlayerController.seekTo(command.videoTime);
                }
                break;

            default:
                console.warn('Received unknown command from editor', command);
        }

        return currentTime;
    }

    currentVideoInfo() {
        return {
            videoId: this.ytPlayerController.currentVideoId,
            videoTime: this.ytPlayerController.getCurrentTime(),
        };
    }

    showInfo(infoText, infoDuration, logToConsole = false) {
        if (logToConsole) {
            console.log(infoText);
        }

        this.setState({ ...this.state, infoText });

        setTimeout(() => {
            this.setState({ ...this.state, infoText: defaultInfoText });
        }, infoDuration * 1000.0);
    }

    handleChange = selectedOption => {
        this.setState({ ...this.state, selectedOption });
        console.log(`Option selected:`, selectedOption);
    };

    render() {
        const getYtPlayerApiCallback = ({ YT, refToPlayerDiv }) => {
            const ytPlayerApi = new YT.Player(refToPlayerDiv, {
                videoId: undefined,
                height: '100%',
                width: '100%',
                events: {
                    onStateChange: this.onPlayerStateChange,
                },
            });
            this.ytPlayerController = new YoutubePlayerController(YT, ytPlayerApi);
        };

        const onVideoIdInput = inputString => {
            console.log('onVideoIdInput called with videoId', inputString);

            if (!inputString) {
                return;
            }

            const videoId = inputString.trim();
            console.log('Cueing video ', videoId);
            this.ytPlayerController.loadAndPlayVideo(videoId);

            // Tell the editor component to load the saved editor value for this video.

            this.setState({
                ...this.state,
                editorCommand: {
                    name: 'loadNoteForVideo',
                    videoId: videoId,
                    resetCommand: () => {
                        this.setState({ ...this.state, editorCommand: undefined });
                    },
                },
            });

            this.editorDivRef.focus();
        };

        const getEditorRef = editorDivRef => {
            this.editorDivRef = editorDivRef;
        };

        return (
            <div className="app">
                <div className="left-panel">
                    <LoadYoutubeVideoIdComponent onSubmit={onVideoIdInput} />
                    <Select
                        value={this.selectedOption}
                        onChange={this.handleChange}
                        options={options}
                    />
                    <YoutubeIframeComponent getYtPlayerApiCallback={getYtPlayerApiCallback} />
                    <LogComponent infoText={this.state.infoText} />
                </div>

                <EditorComponent
                    parentApp={this}
                    editorCommand={this.state.editorCommand}
                    getEditorRef={getEditorRef}
                />
            </div>
        );
    }
}
