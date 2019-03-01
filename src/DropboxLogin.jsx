// Login screen that allows user to enable saving notes to their dropbox.

import React, { Component, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
    Button,
    CssBaseline,
    FormControl,
    Checkbox,
    Input,
    InputLabel,
    Paper,
    Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    main: {
        width: 'auto',
        display: 'block', // Fix IE 11 issue.
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
            width: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    },
    paper: {
        marginTop: theme.spacing.unit * 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit *
            3}px`,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing.unit,
    },
    submit: {
        marginTop: theme.spacing.unit * 3,
    },
});

const defaultAccessToken = process.env.REACT_APP_DROPBOX_SOUMIKS_ACCESS_TOKEN || '';

const DropboxLogin = props => {
    const { classes, handleTokenSubmit } = props;

    const [inputToken, setInputToken] = useState(
        process.env.REACT_APP_DROPBOX_SOUMIKS_ACCESS_TOKEN || ''
    );

    return (
        <main className={classes.main}>
            <CssBaseline />
            <Paper className={classes.paper}>
                <Typography component="h1" variant="h5">
                    Video Annotator
                </Typography>
                <form className={classes.form} onSubmit={() => handleTokenSubmit(inputToken)}>
                    <FormControl margin="normal" fullWidth>
                        <InputLabel default={inputToken}>Dropbox Access Token</InputLabel>
                        <Input
                            id="oauth_user_access_token"
                            autoFocus={true}
                            onChange={e => setInputToken(e.target.value)}
                        />
                    </FormControl>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        Submit Token
                    </Button>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        Proceed without sync
                    </Button>
                </form>
            </Paper>
        </main>
    );
};

DropboxLogin.propTypes = {
    classes: PropTypes.object.isRequired,
    handleTokenSubmit: PropTypes.func.isRequired,
};

DropboxLogin.defaultProps = {
    handleTokenSubmit: token => console.log('Token submitted = ', token),
};

export default withStyles(styles)(DropboxLogin);
