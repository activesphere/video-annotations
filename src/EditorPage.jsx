import './Main.css';

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

import EditorComponent from './EditorComponent';
import VideoPathInput from './VideoPathInput';
import getYoutubeTitle from 'get-youtube-title';
import PropTypes from 'prop-types';
import IFrameStyleWrapper from './IFrameStyleWrapper';
import { SnackbarContext } from './context/SnackbarContext';

const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
    console.log('Require REACT_APP_YOUTUBE_API_KEY from .env file');
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
        console.assert(playerApi !== undefined);
        this.YT = YT;
        this.playerApi = playerApi;
        this.currentVideoId = undefined;
        this.currentVideoTitle = undefined;
        this.currentPlayerState = 'unstarted';
    }

    setVideoTitle() {
        if (this.currentVideoId === undefined) {
            return;
        }

        this.currentVideoTitle = undefined;

        getYoutubeTitle(this.currentVideoId, YOUTUBE_API_KEY, (err, title) => {
            if (!err) {
                this.currentVideoTitle = title;
            } else {
                return new Error(`Failed to retrieve title of video - ${this.currentVideoId}`);
            }
            console.log('Title = ', title, 'Error =', err);
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

        console.log('playVideo', this.currentVideoId);
        this.playerApi.playVideo(this.currentVideoId);
    }

    loadAndPlayVideo(videoId) {
        this.currentVideoId = videoId;
        this.currentVideoTitle = undefined;
        console.log('this.playerApi =', this.playerApi);
        console.log('playVideo =', this.playerApi.playVideo);
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
        return undefined;
    }

    addToCurrentTime(seconds) {
        const currentTime = this.playerApi.getCurrentTime();
        this.playerApi.seekTo(Math.max(currentTime + seconds, 0));
    }

    getCurrentTime() {
        return this.playerApi && this.playerApi.getCurrentTime
            ? this.playerApi.getCurrentTime()
            : undefined;
    }

    getVideoTitle() {
        return this.currentVideoTitle;
    }

    seekTo(timeInSeconds) {
        console.log('seekTo', timeInSeconds, 'seconds');
        this.playerApi.seekTo(timeInSeconds);
    }
}

// The commands from console are send via the App component
class EditorPage extends Component {
    static propTypes = {
        startingVideoId: PropTypes.string,
        startingVideoTime: PropTypes.number,
        startingPopperMessage: PropTypes.string,
    };

    static defaultProps = {
        startingVideoId: undefined,
        startingPopperMessage: undefined,
    };

    static contextType = SnackbarContext;

    constructor(props) {
        super(props);

        this.state = {
            editorCommand: undefined,
            infoText: undefined,
            infoLastTime: undefined,
            selectedOption: undefined,
            startingPopperMessage: this.props.startingPopperMessage,
        };

        // We keep a handle to the youtube player. This is the player API object, not the dom
        // element itself.
        this.ytPlayerController = undefined;
        this.doVideoCommand = this.doVideoCommand.bind(this);

        this.iframeRef = React.createRef();
    }

    tellPluginToRemovePauseOverlay = () => {
        window.frames[0].postMessage({ type: 'VID_ANNOT_REMOVE_PAUSE_OVERLAY' }, '*');
    };

    doVideoCommand(command, params) {
        console.assert(this.ytPlayerController !== undefined);
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
                if (
                    !params.videoId ||
                    (!params.videoTime !== undefined && params.videoTime !== 0)
                ) {
                    // Check if currently playing videoId is the same as sent as params, if not we
                    // will load the given video
                    if (this.ytPlayerController.currentVideoId !== params.videoId) {
                        this.ytPlayerController.loadAndPlayVideo(params.videoId);
                    }
                    this.ytPlayerController.seekTo(params.videoTime);
                }
                break;

            default:
                console.warn('Received unknown command from editor', command, params);
        }

        return currentTime;
    }

    currentVideoInfo() {
        const info = { videoId: undefined, videoTime: undefined, videoTitle: undefined };
        if (this.ytPlayerController) {
            info.videoId = this.ytPlayerController.currentVideoId;
            info.videoTime = this.ytPlayerController.getCurrentTime();
            info.videoTitle = this.ytPlayerController.getVideoTitle();
        }
        // console.log('Current video info =', info);
        return info;
    }

    // Called by editor component. Updates current note menu items
    updateNoteMenu = () => {
        // const noteMenuItems = localStorageHelper.getNoteMenuItems();
        // this.setState({ noteMenuItems });
    };

    tellEditorToLoadNote = videoId => {
        this.setState({
            editorCommand: {
                name: 'loadNoteForVideo',
                videoId: videoId,
                resetCommand: () => {
                    this.setState({ editorCommand: undefined });
                    const { history } = this.props;
                    history.push(`/editor/${videoId}`);
                },
            },
        });

        this.context.openSnackbar({ message: `Loading video ${videoId}` });
    };

    componentDidMount() {
        const { ytAPI } = this.props;
        if (this.iframeRef.current) {
            let ytPlayerApi = undefined;

            const { startingVideoId, startingVideoTime } = this.props;

            ytPlayerApi = new ytAPI.Player(this.iframeRef.current, {
                height: '100%',
                width: '100%',
                events: {
                    onStateChange: newState => {
                        console.log('Setting state ', ytNameOfPlayerState[newState.data]);
                        this.ytPlayerController.currentPlayerState =
                            ytNameOfPlayerState[newState.data];
                    },

                    onReady: () => {
                        this.ytPlayerController = new YoutubePlayerController(ytAPI, ytPlayerApi);
                        if (startingVideoId) {
                            this.ytPlayerController.loadAndPlayVideo(startingVideoId);
                            console.log('Loading video and note for ', this.props.startingVideoId);
                            console.log('Loading video and note for ', this.props.startingVideoId);
                            const videoId = this.props.startingVideoId;
                            this.tellEditorToLoadNote(videoId);
                            if (startingVideoTime) {
                                this.ytPlayerController.seekTo(startingVideoTime);
                            }
                        }
                    },
                },
            });
        }

        if (this.state.startingPopperMessage) {
            console.log('Showing starting popper message');
            this.context.openSnackbar({ message: this.state.startingPopperMessage });
            setTimeout(() => {
                this.setState({ startingPopperMessage: undefined });
            });
        }
    }

    render() {
        const { match } = this.props;
        const videoId = match.params.videoId || '';

        return (
            <>
                <div className="two-panel-div">
                    <div className="left-panel">
                        <VideoPathInput currentVideoId={videoId} />
                        <IFrameStyleWrapper>
                            <div ref={this.iframeRef} id={'__yt_iframe__'} />
                        </IFrameStyleWrapper>
                    </div>
                    <EditorComponent
                        parentApp={this}
                        dispatch={this.doVideoCommand}
                        editorCommand={this.state.editorCommand}
                        showInfo={this.props.showInfo}
                    />
                </div>
            </>
        );
    }
}

export default withRouter(EditorPage);
