import React, { useRef } from 'react';
import Paper from '@material-ui/core/Paper';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import EditorComponent from './EditorComponent';
import IFrameStyleWrapper from './IFrameStyleWrapper';
import AppConfig from './AppConfig';
import usePlayer from './youtube/player';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridGap: '1rem',
    },
    iframeStyle: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
  })
);

type Props = {
  ytAPI: YT.Player;
  videoId?: string;
};

const EditorPage = ({ ytAPI, videoId }: Props) => {
  const classes = useStyles();
  const iframeRef = useRef<HTMLElement>(null);

  const { player, title } = usePlayer({ api: ytAPI, videoId, ref: iframeRef });

  return (
    <div className={classes.root}>
      <IFrameStyleWrapper>
        <Paper className={classes.iframeStyle} ref={iframeRef} id={AppConfig.YoutubeIframeId} />
      </IFrameStyleWrapper>
      <EditorComponent player={player} videoId={videoId} videoTitle={title} />
    </div>
  );
};

export default EditorPage;
