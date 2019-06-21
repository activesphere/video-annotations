import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      minWidth: '50%',
    },
    container: {
      zIndex: 1,
      position: 'sticky',
      top: 0,
      margin: theme.spacing(2),
    },
    media: {
      position: 'relative',
      width: '100%',
      height: 0,
      paddingBottom: '56.25%',
    },
  })
);

const IFrameStyleWrapper = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div className={classes.media}>{children}</div>
      </div>
    </div>
  );
};

export default IFrameStyleWrapper;
