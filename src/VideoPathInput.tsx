import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import getYouTubeID from 'get-youtube-id';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const isYouTubeID = (str: string) => str && str.length === 11;

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      marginLeft: 8,
      flex: 1,
    },
  })
);

const VideoPathInput = ({ currentVideoId = null }) => {
  const classes = useStyles();
  const [text, setText] = useState(currentVideoId || '');
  const [isValidVideoId, setIsValidVideoId] = useState(false);

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = e => {
    const value = e.target.value;
    const videoId = isYouTubeID(value) ? value : getYouTubeID(value);
    setText(value);

    if (!videoId) {
      return;
    }
    setIsValidVideoId(true);
    setText(value);
  };

  useEffect(() => {
    if (isValidVideoId) {
      setIsValidVideoId(false);
    }
  }, [isValidVideoId]);

  if (isValidVideoId) {
    return <Redirect to={`/editor/${text}`} />;
  }

  return (
    <TextField
      id="youtube_video_input"
      className={classes.root}
      placeholder="Paste video id or path here"
      onChange={onChange}
      spellCheck={false}
    />
  );
};

export default VideoPathInput;
