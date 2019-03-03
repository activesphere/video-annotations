import './Main.css';

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import EditorComponent from './EditorComponent';
import VideoPathInput from './VideoPathInput';
import getYoutubeTitle from 'get-youtube-title';
import { noteStorageManager } from './save_note';
import PropTypes from 'prop-types';
import StyledPopper from './InfoPopper';
import IFrameStyleWrapper from './IFrameStyleWrapper';

// TODO: Remove this API key from public github? Obtain from user's OS env key.
const YOUTUBE_API_KEY = 'AIzaSyB0Hslfl-deOx-ApFvTE0osjJCy2T_1uL0';

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
                return new Error(`Failed to retrive title of video - ${this.currentVideoId}`);
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

    togglePause() {
        if (this.currentPlayerState === 'paused') {
            this.playVideo();
        } else if (this.currentPlayerState === 'playing') {
            this.pauseVideo();
        }
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

    constructor(props) {
        super(props);

        this.state = {
            editorCommand: undefined,
            infoText: undefined,
            infoLastTime: undefined,
            selectedOption: undefined,
            noteMenuItems: noteStorageManager.getNoteMenuItems(),
            startingPopperMessage: this.props.startingPopperMessage,
        };

        // Editor ref, set by the child component
        this.editorRef = undefined;
        this.editorContainerDiv = undefined;

        this.popoverRef = undefined;

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.ytPlayerController = undefined;

        this.doVideoCommand = this.doVideoCommand.bind(this);

        this.iframeRef = React.createRef();
    }

    // TODO(rksht) - perhaps break these into multiple functions instead of sending command objects,
    // which is a leftover from the previous style.
    doVideoCommand(command, params) {
        console.assert(this.ytPlayerController !== undefined);
        const currentTime = this.ytPlayerController.getCurrentTime();

        switch (command) {
            case 'playVideo':
                this.ytPlayerController.playVideo();
                break;

            case 'pauseVideo':
                this.ytPlayerController.pauseVideo();
                break;

            case 'restartVideo':
                this.ytPlayerController.seekTo(0);
                break;

            case 'togglePause':
                this.ytPlayerController.togglePause();
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

    getEditorContainerDiv = ref => {
        this.editorContainerDiv = ref;
    };

    showInfo = (infoText, infoDuration, popoverText = undefined, logToConsole = false) => {
        if (logToConsole) {
            console.log('infoText =', infoText, ', infoDuration =', infoDuration);
        }

        if (popoverText) {
            infoText = popoverText;
        }

        this.setState({ infoText });

        // Unset the popover after given duration. This is *probably* not safe. Not sure.
        setTimeout(() => {
            this.setState({ infoText: undefined });
        }, infoDuration * 1000.0);
    };

    // Called by editor component. Updates current note menu items
    updateNoteMenu = () => {
        const noteMenuItems = noteStorageManager.getNoteMenuItems();
        this.setState({ noteMenuItems });
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

        this.showInfo(`Loading video ${videoId}`, 1.5, 'Loading video', true);
    };

    handleNotemenuChange = e => {
        const videoId = e.target.value;

        const { history } = this.props;
        history.push(`/editor/${videoId}`);
    };

    _saveEditorPageState = () => {
        const { videoId, videoTime } = this.currentVideoInfo();
        this.props.saveLastEditorPageState(videoId, videoTime);
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
            this.showInfo('', 1.0, this.state.startingPopperMessage);
            setTimeout(() => {
                this.setState({ startingPopperMessage: undefined });
            });
        }
    }

    componentWillUnmount() {
        if (this.ytPlayerController) {
            let { videoId, videoTime } = this.currentVideoInfo();
            const playerState = this.ytPlayerController.currentPlayerState;
            if (playerState !== 'paused' && playerState !== 'playing') {
                videoTime = undefined;
            }
            console.log(`Saving last editor page state - id - ${videoId}, time - ${videoTime}`);
        }

        this._saveEditorPageState();
    }

    render() {
        const { match } = this.props;
        const videoId = match.params.videoId;
        const { noteMenuItems } = this.state;
        console.log('noteMenuItems', videoId, this.state.noteMenuItems);

        return (
            <>
                <div className="two-panel-div">
                    <div className="left-panel">
                        <VideoPathInput />
                        <Select
                            value={videoId}
                            onChange={this.handleNotemenuChange}
                            placeholder="Saved notes..."
                        >
                            {noteMenuItems.map(item => (
                                <MenuItem value={item.value}>{item.label}</MenuItem>
                            ))}
                        </Select>

                        <IFrameStyleWrapper>
                            <div ref={this.iframeRef} />
                        </IFrameStyleWrapper>
                    </div>

                    <EditorComponent
                        parentApp={this}
                        dispatch={this.doVideoCommand}
                        editorCommand={this.state.editorCommand}
                    />
                </div>
                <StyledPopper
                    anchorElement={this.state.infoText ? this.editorContainerDiv : undefined}
                    ref={r => (this.popoverRef = r)}
                >
                    {this.state.infoText}
                </StyledPopper>
            </>
        );
    }
}

export default withRouter(EditorPage);
