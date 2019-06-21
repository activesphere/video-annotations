import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  Grid,
} from '@material-ui/core';
import CardActionArea from '@material-ui/core/CardActionArea';
import classNames from 'classnames';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import { getNoteMenuItemsForCards, deleteNoteWithId } from './LocalStorageHelper';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: 'relative',
    },
    icon: {
      marginRight: theme.spacing(2),
    },
    heroUnit: {
      backgroundColor: theme.palette.background.paper,
    },
    heroContent: {
      maxWidth: 600,
      margin: '0 auto',
      padding: `${theme.spacing(4)}px 0 ${theme.spacing(2)}px`,
    },
    heroButtons: {
      marginTop: theme.spacing(4),
    },
    layout: {
      width: 'auto',
      marginLeft: theme.spacing(3),
      marginRight: theme.spacing(3),
      [theme.breakpoints.up(1100 + theme.spacing(3) * 2)]: {
        width: 1100,
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    },
    cardGrid: {
      padding: `${theme.spacing(8)}px 0`,
    },
    card: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    contentAction: {
      height: '100%',
    },
    cardMedia: {
      paddingTop: '56.25%', // 16:9
    },
    cardContent: {
      flexGrow: 1,
    },
    footer: {
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing(6),
    },
  })
);

function makeYoutubeImageUrl(videoId: string) {
  if (!videoId) {
    return '';
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

interface Card {
  id: string;
  title: string;
}

type Directions = 'left' | 'right' | 'up' | 'down';

const NotesPage = () => {
  const classes = useStyles();
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    if (cards) return;

    getNoteMenuItemsForCards().then(res => setCards(res || []));
  });

  if (!cards) {
    return <div>Loading</div>;
  }

  const cardElements = cards.map(({ id, title }, index) => (
    <Grid key={id} item sm={6} md={4} lg={3}>
      <Card onClick={() => console.log('clikc on card')} className={classes.card}>
        <CardActionArea className={classes.contentAction} component={Link} to={`/v/${id}`}>
          <CardMedia className={classes.cardMedia} image={makeYoutubeImageUrl(id)} title={title} />
          <CardContent className={classes.cardContent}>
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button
            size="small"
            color="primary"
            onClick={e => {
              e.stopPropagation();
              deleteNoteWithId(id);
            }}
          >
            Delete
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ));

  return (
    <main className={classNames(classes.layout, classes.cardGrid)}>
      <Grid container direction="row" spacing={4}>
        {cardElements}
      </Grid>
    </main>
  );
};

export default NotesPage;
