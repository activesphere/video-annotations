import React, { useState } from 'react';
import classnames from 'classnames';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import InputBase from '@material-ui/core/InputBase';
import isYouTubeURL from './utils/isYouTubeURL';
import parseYouTubeId from './youtube/parseId';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
  })
);

const AddVideo = ({ history }: RouteComponentProps) => {
  const classes = useStyles();
  const [searchFocused, setSearchFocus] = useState(false);
  const searchFocus = () => setSearchFocus(true);
  const searchBlur = () => setSearchFocus(false);

  const onChange = (value: string) => {
    if (!isYouTubeURL(value)) return;
    const videoId = parseYouTubeId(value);
    if (!videoId) return;

    history.push(`/v/${videoId}`);
  };

  return (
    <div className={classnames(classes.search, searchFocused && classes.searchFullWidth)}>
      <div className={classes.searchIcon}>
        <AddCircleOutlineIcon />
      </div>
      <InputBase
        onChange={e => onChange(e.target.value)}
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
  );
};

export default withRouter(AddVideo);
