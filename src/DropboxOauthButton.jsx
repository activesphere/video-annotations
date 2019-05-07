import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    leftIcon: {
        marginRight: theme.spacing.unit,
    },
    rightIcon: {
        marginLeft: theme.spacing.unit,
    },
    iconSmall: {
        fontSize: 20,
    },
});

const DropboxOauthButton = ({ getToken, isAuthenticated, classes }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [inputText, setInputText] = useState(undefined);

    const handleClickOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleClickCancel = () => {
        setDialogOpen(false);
        setInputText(undefined);
    };

    const handleClickDoAuth = () => {
        setDialogOpen(false);
        setInputText(undefined);
        getToken && getToken(inputText);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    return (
        <>
            <Button
                variant="contained"
                color="default"
                disabled={isAuthenticated}
                onClick={handleClickOpenDialog}
            >
                Oauth into Dropbox
                <CloudUploadIcon classes={classes.rightIcon} />
            </Button>

            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Dropbox Oauth</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="__oauth_token_field__"
                        label="Oauth Token"
                        type="password"
                        fullWidth
                        onChange={e => {
                            setInputText(e.target.value);
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClickCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleClickDoAuth} color="primary">
                        Authenticate
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default withStyles(styles)(DropboxOauthButton);
