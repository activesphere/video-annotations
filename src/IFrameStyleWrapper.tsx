import React from 'react';
import { Paper, Slide } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      zIndex: 1,
      position: 'relative',
      margin: theme.spacing(1),
    },
  })
);

const IFrameStyleWrapper = ({ children }: { children: React.ReactNode}) => {
  const classes = useStyles();

  return (
    <Slide direction="right" in={true} mountOnEnter unmountOnExit >
      <Paper elevation={0} className={classes.paper}>
        {children}
      </Paper>
    </Slide>
  );
};

export default IFrameStyleWrapper;
