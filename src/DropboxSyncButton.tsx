import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import CloudOffIcon from '@material-ui/icons/CloudOff';
/* import CloudDownloadIcon from '@material-ui/icons/CloudDownload'; */
import CloudDoneIcon from '@material-ui/icons/CloudDone';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import CircularProgress from '@material-ui/core/CircularProgress';

import * as session from './session';

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

  const [dbxSetupState, setDbxSetupState] = useState<string>(setupState);
  const [showTokenInput, setTokenInput] = useState<boolean>();

  const setToken = (token: string) => {
    session.set('dbxToken', token);
  };

  const classes = useStyles();

  // @ts-ignore
  const toggleTokenInput = () => setTokenInput(prevState => !prevState);

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
    <Grid direction="row">
      <Grid item>
        {dbxSetupState === 'init' && !showTokenInput && (
          <IconButton onClick={toggleTokenInput} area-label="setup dropbox">
            <CloudOffIcon />
          </IconButton>
        )}
        {dbxSetupState === 'loading' && <CircularProgress size={24} className={classes.progress} />}
        {dbxSetupState === 'complete' && <CloudDoneIcon />}
        {dbxSetupState === 'init' &&
          showTokenInput && [
            <IconButton onClick={handleTokenSubmit} area-label="save">
              <CheckCircleIcon />
            </IconButton>,
            <IconButton onClick={toggleTokenInput} area-label="cancel">
              <CancelIcon />
            </IconButton>,
            <TextField
              autoComplete="dropbox-access-token"
              onChange={e => setToken(e.target.value)}
              id="input-with-icon-grid"
              label="Dropbox access token"
            />,
          ]}
      </Grid>
    </Grid>
  );
};

export default DropboxSyncButton;
