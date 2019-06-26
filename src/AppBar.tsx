import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import DropboxSyncButton from './DropboxSyncButton';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Button from '@material-ui/core/Button';
import AddVideo from './AddVideo';

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
        <AddVideo />
        <div className={classes.grow} />
        <DropboxSyncButton />
      </Toolbar>
    </AppBar>
  );
};

export default withRouter(PrimarySearchAppBar);
