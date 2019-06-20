import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import DropboxSyncButton from './DropboxSyncButton';
import FolderIcon from '@material-ui/icons/Folder';
import SlideshowIcon from '@material-ui/icons/Slideshow';

import { Tabs, Tab } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { Location } from 'history';

const getTabValue = (path: string) => {
  if (path.indexOf('/editor') === 0) return 'editor';
  if (path.indexOf('/saved_notes') === 0) return 'notes';
  return null;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    grow: {
      flexGrow: 1,
    },
    tab: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      margin: theme.spacing(1),
    },
  })
);

const PrimarySearchAppBar = ({ location }: { location: Location }) => {
  const classes = useStyles();

  return (
    <div className={classes.grow}>
      <AppBar position="static">
        <Toolbar>
          <Tabs value={getTabValue(location.pathname)}>
            <Tab
              value="editor"
              label={
                <div className={classes.tab}>
                  <SlideshowIcon className={classes.icon} />
                  <Typography>Edit</Typography>
                </div>
              }
              component={Link}
              to="/editor"
            />
            <Tab
              value="notes"
              label={
                <div className={classes.tab}>
                  <FolderIcon className={classes.icon} />
                  <Typography>Notes</Typography>
                </div>
              }
              component={Link}
              to="/saved_notes"
            />
          </Tabs>
          <div className={classes.grow} />
            <DropboxSyncButton />
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default PrimarySearchAppBar;
