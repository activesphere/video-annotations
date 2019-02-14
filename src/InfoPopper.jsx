import React, { Component } from 'react';
import { Typography, Popper, Fade, Paper } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

// A popover component that works pretty much as a messagebox.
class InfoPopper extends Component {
    render() {
        const { classes, anchorElement } = this.props;
        const open = !!anchorElement;
        const id = open ? '__info_popper__' : null;

        return (
            <Popper id={id} open={open} anchorEl={anchorElement} transition>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={350}>
                        <Paper className={classes.paper}>
                            <Typography className={classes.typography}>
                                {this.props.children}
                            </Typography>
                        </Paper>
                    </Fade>
                )}
            </Popper>
        );
    }
}

// Unlike usual JSS, material-ui styles are actually functions that can use the theme
// object passed to them and return a final style object.
const stylesForPopper = theme => {
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

// Create a styled popover. withStyles will translate the css-in-js to a stylesheet and provide the
// `classes` prop.
export default withStyles(stylesForPopper)(InfoPopper);
