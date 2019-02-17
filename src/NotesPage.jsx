import React, { Component } from 'react';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Typography,
    CssBaseline,
    Grid,
} from '@material-ui/core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

import { noteStorageManager } from './save_note.js';
import { makeYoutubeUrl, makeYoutubeImageUrl } from './utils';

// This 'NotesPage' is a full page currently. But I will switch to using it as a modal after I've
// designed it well enough.

const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const toEditor = id => window.history.pushState({ id }, '', `/editor/${id}`);

const NotesPage = ({ cards, classes }) => {
    if (!cards) {
        cards = noteStorageManager.getNoteMenuItemsForCards();
    }

    // Creating an array of card elements from the note info
    const cardElements = cards.map(({ videoId, videoTitle }) => {
        return (
            <Grid item key={videoId} sm={6} md={4} lg={3}>
                <Card className={classes.card}>
                    <CardMedia
                        className={classes.cardMedia}
                        image={makeYoutubeImageUrl(videoId)}
                        title={videoTitle}
                    />
                    <CardContent className={classes.cardContent}>
                        <Typography gutterBottom variant="h5" component="h2">
                            {videoTitle}
                        </Typography>
                        <Typography>
                            This is a media card. You can use this section to describe the content.
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button size="small" color="primary" onClick={() => toEditor(videoId)}>
                            Edit note
                        </Button>
                        <Button
                            size="small"
                            color="primary"
                            onClick={() => window.open(makeYoutubeUrl(videoId))}
                        >
                            Open Video
                        </Button>
                    </CardActions>
                </Card>
            </Grid>
        );
    });

    return (
        <>
            <CssBaseline />
            <main>
                {/* Hero unit */}
                <div className={classes.heroUnit}>
                    <div className={classes.heroContent}>
                        <Typography
                            component="h1"
                            variant="h2"
                            align="center"
                            color="textPrimary"
                            gutterBottom
                        >
                            Saved Notes
                        </Typography>
                        <Typography variant="h6" align="center" color="textSecondary" paragraph>
                            All the videos you saved notes for.
                        </Typography>
                    </div>
                </div>
                <div className={classNames(classes.layout, classes.cardGrid)}>
                    {/* End hero unit */}
                    <Grid container spacing={40}>
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
        marginRight: theme.spacing.unit * 2,
    },
    heroUnit: {
        backgroundColor: theme.palette.background.paper,
    },
    heroContent: {
        maxWidth: 600,
        margin: '0 auto',
        padding: `${theme.spacing.unit * 4}px 0 ${theme.spacing.unit * 2}px`,
    },
    heroButtons: {
        marginTop: theme.spacing.unit * 4,
    },
    layout: {
        width: 'auto',
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(1100 + theme.spacing.unit * 3 * 2)]: {
            width: 1100,
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    },
    cardGrid: {
        padding: `${theme.spacing.unit * 8}px 0`,
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
        padding: theme.spacing.unit * 6,
    },
});

export default withStyles(styles)(NotesPage);
