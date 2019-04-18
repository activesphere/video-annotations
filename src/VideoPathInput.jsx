import React, { useState, useEffect } from 'react';
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

const VideoPathInput = ({ classes, currentVideoId = '' }) => {
    const [text, setText] = useState(currentVideoId);
    const [isValidVideoId, setIsValidVideoId] = useState(!!getYouTubeID(text));

    const onChange = e => {
        const { value } = e.target;
        const videoId = (isYouTubeID(value) && value) || getYouTubeID(value, { fuzzy: false });

        setText(value);

        if (!videoId) {
            return;
        }
        console.log('videoId =', videoId);
        setIsValidVideoId(true);
    };

    useEffect(() => {
        if (isValidVideoId) {
            setIsValidVideoId(false);
        }
    });

    if (isValidVideoId) {
        const videoId = isYouTubeID(text) ? text : getYouTubeID(text);
        return <Redirect to={`/editor/${videoId}`} />;
    }

    return (
        <TextField
            id="youtube_video_input"
            className={classes.root}
            placeholder="Paste video id or path here"
            onChange={onChange}
            spellCheck="false"
            value={text}
        />
    );
};

export default withStyles(styles)(VideoPathInput);
