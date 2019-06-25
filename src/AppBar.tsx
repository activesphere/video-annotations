import React, { useState } from 'react';
import classnames from 'classnames';
import { withRouter } from 'react-router-dom';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import DropboxSyncButton from './DropboxSyncButton';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import InputBase from '@material-ui/core/InputBase';
import Button from '@material-ui/core/Button';

import { Link } from 'react-router-dom';
import { Location } from 'history';

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
      width: '100%',
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
    smallFont: {
      fontSize: '1rem',
    },
  })
);

const PrimarySearchAppBar = ({ location }: { location: Location }) => {
  const classes = useStyles();
  const [searchFocused, setSearchFocus] = useState(false);
  const searchFocus = () => setSearchFocus(true);
  const searchBlur = () => setSearchFocus(false);

  const isHome = location.pathname === '/';

  return (
    <AppBar color="inherit" position="static">
      <Toolbar className={classes.root}>
        {!isHome && (
          <Button size="small" component={Link} to="/">
            <ArrowBackIosIcon className={classes.smallFont} fontSize="small" />
            List
          </Button>
        )}
        <div className={classnames(classes.search, searchFocused && classes.searchFullWidth)}>
          <div className={classes.searchIcon}>
            <AddCircleOutlineIcon />
          </div>
          <InputBase
            onFocus={searchFocus}
            onBlur={searchBlur}
            placeholder="https://youtube.com/watch?v=..."
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

export default withRouter(PrimarySearchAppBar);
