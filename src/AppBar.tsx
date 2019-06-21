import React, { useState } from 'react';
import classnames from 'classnames';
import { fade, makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import DropboxSyncButton from './DropboxSyncButton';
import FolderIcon from '@material-ui/icons/Folder';
import SlideshowIcon from '@material-ui/icons/Slideshow';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Link } from 'react-router-dom';
import { Location } from 'history';

const getTabValue = (path: string) => {
  if (path.indexOf('/editor') === 0) return 'editor';
  if (path.indexOf('/saved_notes') === 0) return 'notes';
  return null;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: '0 auto',
      minWidth: '68rem',
    },
    grow: {
      flexGrow: 1,
    },
    search: {
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: 'hsl(0, 0%, 93%)',
      '&:hover': {
        backgroundColor: 'hsl(0, 0%, 90%)',
      },
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      transition: theme.transitions.create('all'),
    },
    searchFullWidth: {
      flexGrow: 1,
    },
    searchIcon: {
      width: theme.spacing(7),
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputRoot: {
      color: 'inherit',
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 7),
    },
    tab: {
      minWidth: '6rem',
      fontWeight: theme.typography.fontWeightRegular,
      marginRight: theme.spacing(4),
      minHeight: '2rem',
      paddingBottom: 0,
      paddingTop: 0,
    },
    tabContent: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 0,
    },
    icon: {
      margin: theme.spacing(1),
    },
  })
);

const PrimarySearchAppBar = ({ location }: { location: Location }) => {
  const classes = useStyles();
  const [searchFocused, setSearchFocus] = useState(false);
  const searchFocus = () => setSearchFocus(true);
  const searchBlur = () => setSearchFocus(false);

  return (
    <AppBar color="inherit" position="static">
      <Toolbar className={classes.root}>
        <Tabs indicatorColor="primary" value={getTabValue(location.pathname)}>
          <Tab
            className={classes.tab}
            value="editor"
            label={
              <div className={classes.tabContent}>
                <SlideshowIcon className={classes.icon} />
                Edit
              </div>
            }
            component={Link}
            to="/editor"
          />
          <Tab
            className={classes.tab}
            value="notes"
            label={
              <div className={classes.tabContent}>
                <FolderIcon className={classes.icon} />
                Notes
              </div>
            }
            component={Link}
            to="/saved_notes"
          />
        </Tabs>
        <div className={classnames(classes.search, searchFocused && classes.searchFullWidth)}>
          <div className={classes.searchIcon}>
            <SearchIcon />
          </div>
          <InputBase
            onFocus={searchFocus}
            onBlur={searchBlur}
            placeholder="Add…"
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            inputProps={{ 'aria-label': 'Search' }}
          />
        </div>
        <div className={classes.grow} />
        <DropboxSyncButton />
      </Toolbar>
    </AppBar>
  );
};

export default PrimarySearchAppBar;
