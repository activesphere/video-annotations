import './Main.css';

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

import EditorComponent from './EditorComponent';
import VideoPathInput from './VideoPathInput';
import getYoutubeTitle from 'get-youtube-title';
import PropTypes from 'prop-types';
import IFrameStyleWrapper from './IFrameStyleWrapper';
import { SnackbarContext } from './context/SnackbarContext';
import AppConfig from './AppConfig';

const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
    alert('REACT_APP_YOUTUBE_API_KEY required in .env file');
}

const ytNameOfPlayerState = {
    '-1': 'unstarted',
    '0': 'ended',
    '1': 'playing',
    '2': 'paused',
    '3': 'buffering',
    '5': 'video_cued',
};

class YoutubePlayerController {
    constructor(YT, playerApi) {
        if (!playerApi) {
            throw new Error('playerApi is null');
        }
        this.YT = YT;
        this.playerApi = playerApi;
        this.currentVideoId = null;
        this.currentVideoTitle = null;
        this.currentPlayerState = 'unstarted';
    }

    setVideoTitle() {
        if (this.currentVideoId === null) {
            return;
        }

        this.currentVideoTitle = null;

        getYoutubeTitle(this.currentVideoId, YOUTUBE_API_KEY, (err, title) => {
            if (!err) {
                this.currentVideoTitle = title;
            } else {
                return new Error(`Failed to retrive title of video - ${this.currentVideoId}`);
            }
        });
    }

    getPlayerState() {
        return this.playerApi.getPlayerState();
    }

    playVideo(videoId = null) {
        if (!videoId && !this.currentVideoId) {
            return;
        }

        this.currentVideoId = videoId ? videoId : this.currentVideoId;

        this.playerApi.playVideo(this.currentVideoId);
    }

    loadAndPlayVideo(videoId) {
        this.currentVideoId = videoId;
        this.currentVideoTitle = null;
        this.playerApi.cueVideoById(this.currentVideoId, 0);
        this.playerApi.playVideo(this.currentVideoId);
        this.setVideoTitle();
    }

    pauseVideo() {
        this.playerApi.pauseVideo(this.currentVideoId);
    }

    // Returns state after toggle
    togglePause() {
        if (this.currentPlayerState === 'paused') {
            this.playVideo();
            return 'playing';
        } else if (this.currentPlayerState === 'playing') {
            this.pauseVideo();
            return 'paused';
        }
        return null;
    }

    addToCurrentTime(seconds) {
        const currentTime = this.playerApi.getCurrentTime();
        this.playerApi.seekTo(Math.max(currentTime + seconds, 0));
    }

    getCurrentTime() {
        return this.playerApi && this.playerApi.getCurrentTime
            ? this.playerApi.getCurrentTime()
            : null;
    }

    getVideoTitle() {
        return this.currentVideoTitle;
    }

    seekTo(timeInSeconds) {
        this.playerApi.seekTo(timeInSeconds);
    }
}

// The commands from console are send via the App component
class EditorPage extends Component {
    static propTypes = {
        startingVideoId: PropTypes.string,
        startingPopperMessage: PropTypes.string,
    };

    static defaultProps = {
        startingVideoId: null,
        startingPopperMessage: null,
    };

    static contextType = SnackbarContext;

    constructor(props) {
        super(props);

        this.state = {
            editorCommand: null,
            infoText: null,
            infoLastTime: null,
            selectedOption: null,
            startingPopperMessage: this.props.startingPopperMessage,
            videoId: null,
        };

        // We keep a handle to the youtube player. This is the player API object, not the dom
        // element itself.
        this.ytPlayerController = null;
        this.doVideoCommand = this.doVideoCommand.bind(this);

        this.iframeRef = React.createRef();
    }

    tellPluginToRemovePauseOverlay = () => {
        window.frames[0].postMessage({ type: AppConfig.RemovePauseOverlayMessage }, '*');
    };

    doVideoCommand(command, params) {
        const currentTime = this.ytPlayerController.getCurrentTime();

        switch (command) {
            case 'playVideo':
                this.ytPlayerController.playVideo();
                break;

            case 'pauseVideo':
                this.ytPlayerController.pauseVideo();
                this.tellPluginToRemovePauseOverlay();
                break;

            case 'restartVideo':
                this.ytPlayerController.seekTo(0);
                break;

            case 'togglePause':
                const playState = this.ytPlayerController.togglePause();
                if (playState === 'paused') {
                    this.tellPluginToRemovePauseOverlay();
                }
                break;

            case 'addToCurrentTime':
                this.ytPlayerController.addToCurrentTime(params.secondsToAdd);
                break;

            case 'seekToTime':
                if (params.videoTime) {
                    this.ytPlayerController.seekTo(params.videoTime);
                }
                break;

            case 'currentTime':
                break;

            default:
                break;
        }

        return currentTime;
    }

    currentVideoInfo() {
        const info = { videoId: null, videoTime: null, videoTitle: null };
        if (this.ytPlayerController) {
            info.videoId = this.ytPlayerController.currentVideoId;
            info.videoTime = this.ytPlayerController.getCurrentTime();
            info.videoTitle = this.ytPlayerController.getVideoTitle();
        }
        // console.log('Current video info =', info);
        return info;
    }

    tellEditorToLoadNote = videoId => {
        /*
        this.setState({
            editorCommand: {
                name: 'loadNoteForVideo',
                videoId: videoId,
                resetCommand: () => {
                    this.setState({ editorCommand: null });
                    const { history } = this.props;
                    history.push(`/editor/${videoId}`);
                },
            },
        });
        */

        this.setState({ videoId });

        this.context.openSnackbar({ message: `Loading video ${videoId}` });
    };

    componentDidMount() {
        const { ytAPI } = this.props;
        if (this.iframeRef.current) {
            let ytPlayerApi = null;

            const { startingVideoId } = this.props;

            ytPlayerApi = new ytAPI.Player(this.iframeRef.current, {
                height: '100%',
                width: '100%',
                events: {
                    onStateChange: newState => {
                        this.ytPlayerController.currentPlayerState =
                            ytNameOfPlayerState[newState.data];
                    },

                    onReady: () => {
                        this.ytPlayerController = new YoutubePlayerController(ytAPI, ytPlayerApi);
                        if (startingVideoId) {
                            this.ytPlayerController.loadAndPlayVideo(startingVideoId);
                            // console.log('Loading video and note for ', this.props.startingVideoId);
                            const videoId = this.props.startingVideoId;
                            this.tellEditorToLoadNote(videoId);
                        }
                    },
                },
            });
        }

        if (this.state.startingPopperMessage) {
            this.context.openSnackbar({ message: this.state.startingPopperMessage });
            setTimeout(() => {
                this.setState({ startingPopperMessage: null });
            });
        }
    }

    render() {
        const { match } = this.props;
        const videoId = match.params.videoId || '';

        return (
            <div className="two-panel-div">
                <div className="left-panel">
                    <VideoPathInput currentVideoId={videoId} />
                    <IFrameStyleWrapper>
                        <div ref={this.iframeRef} id={AppConfig.YoutubeIframeId} />
                    </IFrameStyleWrapper>
                </div>
                <EditorComponent
                    parentApp={this}
                    doCommand={this.doVideoCommand}
                    editorCommand={this.state.editorCommand}
                    showInfo={this.props.showInfo}
                    videoId={videoId}
                />
            </div>
        );
    }
}

export default withRouter(EditorPage);
