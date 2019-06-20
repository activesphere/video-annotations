import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  CssBaseline,
  Grid,
  Slide,
} from '@material-ui/core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

import { getNoteMenuItemsForCards, deleteNoteWithId } from './LocalStorageHelper';
import { Link } from 'react-router-dom';
import seedrandom from 'seedrandom';

function makeYoutubeImageUrl(videoId, imageNumber = 1) {
  if (!videoId) {
    return '';
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

const NotesPage = ({ classes }) => {
  const [cards, setCards] = useState(null);

  useEffect(() => {
    if (cards) return;

    getNoteMenuItemsForCards().then(res => setCards(res || []));
  });

  if (!cards) {
    return 'Loading';
  }

  const rng = seedrandom(`${cards.length}`);

  // Generate random slide-in directions for each card
  const directions = ['left', 'right', 'up', 'down'];
  const directionOfCard = [];
  for (let i = 0; i < cards.length; ++i) {
    const d = rng.int32() % directions.length;
    directionOfCard.push(d);
  }

  // Creating an array of card elements from the note info
  const cardElements = cards.map(({ id, title }, index) => {
    return (
      <Slide key={id} direction={directions[index]} in={true} mountOnEnter unmountOnExit>
        <Grid item sm={6} md={4} lg={3}>
          <Card className={classes.card}>
            <CardMedia
              className={classes.cardMedia}
              image={makeYoutubeImageUrl(id)}
              title={title}
            />
            <CardContent className={classes.cardContent}>
              <Typography variant="h5" component="h2">
                {title}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" component={Link} to={`/editor/${id}`}>
                Edit
              </Button>
              <Button
                size="small"
                color="primary"
                onClick={() => {
                  deleteNoteWithId(id);
                }}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Slide>
    );
  });

  return (
    <>
      <CssBaseline />
      <main>
        <div className={classNames(classes.layout, classes.cardGrid)}>
          <Grid container spacing={4}>
            {cardElements}
          </Grid>
        </div>
      </main>
    </>
  );
};

const styles = theme => ({
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
});

export default withStyles(styles)(NotesPage);
