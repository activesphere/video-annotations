import React from 'react';
import getYouTubeID from 'get-youtube-id';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const isYouTubeID = str => str && str.length === 11;

const styles = {
    root: {
        marginLeft: 8,
        flex: 1,
    },
};

const VideoPathInput = ({ classes }) => {
    const onChange = e => {
        const { value } = e.target;

        const videoId = isYouTubeID(value) ? value : getYouTubeID(value);

        if (!videoId) {
            return;
        }

        window.history.pushState({ videoId }, '', `/editor/${videoId}`);
    };

    return (
        <TextField
            id="youtube_video_input"
            className={classes.root}
            placeholder="Paste video id or path here"
            onChange={onChange}
            spellCheck="false"
        />
    );
};

export default withStyles(styles)(VideoPathInput);
