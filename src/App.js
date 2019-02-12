import './App.css';

import React, { Component } from 'react';
import Select from 'react-select';

import YoutubeIframeComponent from './YoutubeIframeComponent';
import LogComponent, { defaultInfoText } from './LogComponent';
import EditorComponent from './EditorComponent';
import LoadYoutubeVideoIdComponent from './LoadYoutubeVideoIdComponent';
import getYoutubeTitle from 'get-youtube-title';
import { noteStorageManager } from './save_note';
import { AppHeader, FooterMenu } from './header_and_footer';

import { Typography, Popover } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import theme from './mui_theme';


// A popover component that works pretty much as a messagebox.
class InfoPopover extends Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,

        // The text to show.
        infoText: PropTypes.string,

        // The element near which the popover will appear. If this is undefined, popover will not be shown
        anchorElement: PropTypes.node,
    };

    static defaultProps = {
        // For debugging. Should not be visible.
        infoText: '',
    };

    constructor(props) {
        super(props);
    }

    render() {
        const { classes, infoText, anchorElement } = this.props;

        console.log('Popover anchorElement = ', anchorElement);

        return (
            <Popover
                id="__info-popover__"
                open={!!anchorElement}
                anchorEl={anchorElement}
                anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
                transformOrigin={{ vertical: 'center', horizontal: 'center' }}
            >
                <Typography className={classes.typography}>{infoText}</Typography>
            </Popover>
        );
    }
}

// Unlike usual JSS, material-ui styles are actually functions that can use the theme
// object passed to them and return a final style object.
const stylesForPopover = theme => {
    return {
        typography: {
            margin: theme.spacing.unit * 2,
            variant: 'h1',
            fontSize: '25px',
            fontFamily: "'Cutive Mono', monospace",
        },
        paper: {
            padding: theme.spacing.unit,
            color: '#e0e0fd',
        },
    };
};

// Create a styled popover. withStyles will translate the css-in-js to a stylesheet and provide the `classes`
// prop.
const StyledPopover = withStyles(stylesForPopover)(InfoPopover);

// TODO: Remove this API key from public github? Obtain from user's OS env key.
const YOUTUBE_API_KEY = 'AIzaSyB0Hslfl-deOx-ApFvTE0osjJCy2T_1uL0';

const yt_player_state_names = {
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
        return this.playerApi ? this.playerApi.getCurrentTime() : undefined;
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
export default class App extends Component {
    static propTypes = {
        onTabChange: PropTypes.func,
        tabNumber: PropTypes.number,
    };

    static defaultProps = {
        onTabChange: (e, value) => {
            console.log('Changed to tab ', value);
        },
        tabNumber: 0,
    };

    constructor(props) {
        super(props);
        this.state = {
            editorCommand: undefined,
            infoText: undefined,
            infoLastTime: undefined,
            selectedOption: undefined,
            noteMenuItems: noteStorageManager.getNoteMenuItems(),
        };

        // Editor ref, set by the child component
        this.editorRef = undefined;
        this.editorContainerDiv = undefined;

        this.popoverRef = undefined;

        // We keep a handle to the youtube player (the player API, not the dom element itself).
        this.ytPlayerController = undefined;
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

            case 'togglePause':
                this.ytPlayerController.togglePause();
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
        const info = { videoId: undefined, videoTime: undefined, videoTitle: undefined };
        if (this.ytPlayerController) {
            info.videoId = this.ytPlayerController.currentVideoId;
            info.videoTime = this.ytPlayerController.getCurrentTime();
            info.videoTitle = this.ytPlayerController.getVideoTitle();
        }
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
            console.log('SETTIMEOUT CALLED!');
            this.setState({ infoText: undefined });
        }, infoDuration * 1000.0);
    };

    // Called by editor component. Updates current note menu items
    updateNoteMenu = () => {
        const noteMenuItems = noteStorageManager.getNoteMenuItems();
        this.setState({ noteMenuItems });
    };

    handleNotemenuChange = selectedOption => {
        this.setState({ selectedOption });
        console.log('Option selected:', selectedOption);

        // Try to load the video
        const videoId = selectedOption.value;

        if (this.ytPlayerController) {
            console.log('Cueing video ', videoId);
            this.ytPlayerController.loadAndPlayVideo(videoId);
        }

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
    };

    handleTabChange = (event, value) => {
        // We first pause the video before switching to the saved notes modal page.
        if (this.ytPlayerController) {
            this.ytPlayerController.pauseVideo();
        }
        this.props.onTabChange(event, value);
    };

    render() {
        const getYtPlayerApiCallback = ({ YT, refToPlayerDiv }) => {
            const ytPlayerApi = new YT.Player(refToPlayerDiv, {
                videoId: undefined,
                height: '100%',
                width: '100%',
                events: {
                    onStateChange: newState => {
                        console.log('Setting state ', yt_player_state_names[newState.data]);
                        this.ytPlayerController.currentPlayerState =
                            yt_player_state_names[newState.data];
                    },
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
                editorCommand: {
                    name: 'loadNoteForVideo',
                    videoId: videoId,
                    resetCommand: () => {
                        this.setState({ ...this.state, editorCommand: undefined });
                    },
                },
            });

            this.showInfo(`Loading video ${inputString}`, 1.5, 'Loading video', true);

            this.editorRef.focus();
        };

        console.log('State = ', this.state);

        return (
            <div className="app" id="__app_element__">
                <MuiThemeProvider theme={theme}>
                    <AppHeader />
                    <div className="two-panel-div">
                        <div className="left-panel">
                            <LoadYoutubeVideoIdComponent onSubmit={onVideoIdInput} />
                            <Select
                                className="react-select-container"
                                classNamePrefix="react-select"
                                value={this.selectedOption}
                                onChange={this.handleNotemenuChange}
                                options={this.state.noteMenuItems}
                                placeholder="Saved notes..."
                            />
                            <YoutubeIframeComponent
                                getYtPlayerApiCallback={getYtPlayerApiCallback}
                            />
                        </div>

                        <EditorComponent
                            parentApp={this}
                            editorCommand={this.state.editorCommand}
                        />
                    </div>
                    <FooterMenu onChange={this.handleTabChange} tabIndex={this.props.tabIndex} />
                    <StyledPopover
                        infoText={this.state.infoText}
                        anchorElement={this.state.infoText ? this.editorContainerDiv : undefined}
                        ref={r => (this.popoverRef = r)}
                    />
                </MuiThemeProvider>
            </div>
        );
    }
}
