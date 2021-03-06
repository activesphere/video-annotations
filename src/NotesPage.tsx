import React, { useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

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
    secondaryButton: {
      color: theme.palette.grey[500],
    },
    footer: {
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing(6),
    },
  })
);

const toYTUrl = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

interface Card {
  id: string;
  title: string;
  filename: string;
}

type Directions = 'left' | 'right' | 'up' | 'down';

const NotesPage = () => {
  const classes = useStyles();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [deleting, setDeleting] = useState<string[]>([]);

  const deleteNote = (name: string) => {
    setDeleting(deleting => deleting.concat([name]));
  };

  const isDeleting = (name: string) => deleting.indexOf(name) !== -1;

  const hasDeleted = (name: string) => {
    setDeleting(deleting => deleting.filter(f => f !== name));
  };

  const onDelete = async (filename: string) => {
    deleteNote(filename);
    deleteNoteWithId(filename).then(() => {
      hasDeleted(filename);
      setCards(cards => (cards ? cards.filter(c => c.filename !== filename) : cards));
    });
  };

  useEffect(() => {
    if (cards) return;

    getNoteMenuItemsForCards().then(res => setCards(res || []));
  });

  if (!cards) {
    return <div>Loading</div>;
  }

  const cardElements = cards.map(({ id, title, filename }, index) => (
    <Grid key={id} item sm={6} md={4} lg={4}>
      <Card className={classes.card}>
        <CardActionArea className={classes.contentAction} component={Link} to={`/v/${id}`}>
          <CardMedia className={classes.cardMedia} image={toYTUrl(id)} title={title} />
          <CardContent className={classes.cardContent}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button
            disabled={isDeleting(filename)}
            variant="outlined"
            disableRipple
            color="primary"
            size="small"
            component={Link}
            to={`/v/${id}`}
          >
            Note
          </Button>
          <Button
            disabled={isDeleting(filename)}
            className={classes.secondaryButton}
            disableRipple
            size="small"
            onClick={e => {
              e.stopPropagation();
              onDelete(filename);
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
