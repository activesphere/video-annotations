import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
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

const VideoPathInput = ({ classes, currentVideoId = undefined }) => {
    const [text, setText] = useState(currentVideoId || '');
    const [loadVideo, setLoadVideo] = useState(false);

    const onChange = e => {
        const { value } = e.target;
        const videoId = isYouTubeID(value) ? value : getYouTubeID(value);

        setText(value);

        if (!videoId) {
            return;
        }
        setLoadVideo(true);
    };

    if (loadVideo) {
        setTimeout(() => {
            setLoadVideo(false);
            setText(text);
        });
        return <Redirect to={`/editor/${text}`} />;
    }

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
