import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import CloudOffIcon from '@material-ui/icons/CloudOff';
/* import CloudDownloadIcon from '@material-ui/icons/CloudDownload'; */
import CloudDoneIcon from '@material-ui/icons/CloudDone';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import CircularProgress from '@material-ui/core/CircularProgress';

import * as session from './session.js';

import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles(theme => ({
  margin: {
    margin: theme.spacing(1),
  },
  progress: {
    margin: theme.spacing(2),
  },
}));

const DropboxSyncButton = () => {
  const sessionToken = session.get('dbxToken');

  const setupState = sessionToken ? 'complete' : 'init';

  const [dbxSetupState, setDbxSetupState] = useState(setupState);
  const [showTokenInput, setTokenInput] = useState(false);

  const setToken = token => {
    session.set('dbxToken', token);
  };

  const classes = useStyles();

  const toggleTokenInput = () => setTokenInput(state => !state);

  const handleTokenSubmit = async () => {
    setTokenInput(false);
    setDbxSetupState('loading');

    try {
      setDbxSetupState('complete');
    } catch (err) {
      setDbxSetupState('failed');
    }
  };

  return (
    <div className={classes.margin}>
      <Grid container spacing={1} alignItems="flex-end">
        <Grid item>
          {dbxSetupState === 'init' && showTokenInput && (
            <>
              <IconButton onClick={handleTokenSubmit} area-label="save">
                <CheckCircleIcon />
              </IconButton>
              <IconButton onClick={toggleTokenInput} area-label="cancel">
                <CancelIcon />
              </IconButton>
            </>
          )}
          {dbxSetupState === 'init' && !showTokenInput && (
            <IconButton onClick={toggleTokenInput} area-label="setup dropbox">
              <CloudOffIcon />
            </IconButton>
          )}
          {dbxSetupState === 'loading' && (
            <CircularProgress size={24} className={classes.progress} />
          )}
          {dbxSetupState === 'complete' && <CloudDoneIcon />}
        </Grid>
        {showTokenInput && (
          <Grid item>
            <TextField
              autoComplete="dropbox-access-token"
              onChange={e => setToken(e.target.value)}
              id="input-with-icon-grid"
              label="Dropbox access token"
            />
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default DropboxSyncButton;
