import React from 'react';
import { Paper, Slide } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    paper: {
        zIndex: 1,
        position: 'relative',
        margin: theme.spacing.unit,
    },
});

const IFrameStyleWrapper = ({ children, classes }) => (
    <Slide direction="right" in={true} mountOnEnter unmountOnExit className="youtube-player">
        <Paper elevation={4} className={classes.paper} id="__iframe_container__">
            {children}
        </Paper>
    </Slide>
);

export default withStyles(styles)(IFrameStyleWrapper);
