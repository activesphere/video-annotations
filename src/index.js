import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import LoadYouTubeIFrameAPI from './LoadYouTubeIFrameAPI';
import { Paper, Tabs, Tab } from '@material-ui/core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter, Switch, Route, Link, Redirect } from 'react-router-dom';
import { SnackbarContextProvider } from './context/SnackbarContext';
import DropboxLogin from './DropboxLogin';
import { Dropbox } from 'dropbox';
import dropboxHelper, { initDropboxHelper } from './dropboxHelper';
import * as LS from './LocalStorageHelper';

import theme from './mui_theme';

const getTabValue = path => {
    if (path.indexOf('/editor') === 0) return 'editor';
    if (path.indexOf('/saved_notes') === 0) return 'notes';
    return null;
};

// prettier-ignore
console.log(`Dropbox Key = ${process.env.REACT_APP_DROPBOX_KEY}, Secret=${process.env.REACT_APP_DROPBOX_SECRET}`);

const rootElement = document.getElementById('root');

const Main = ({ ytAPI }) => {
    const [lastVideoId, setLastVideoId] = useState(undefined);
    const [infoText, setInfoText] = useState(undefined);

    const [dropboxSetupComplete, setDropboxSetupComplete] = useState(false);
    // ^ Means that we have initialized the dropbox api and also made sure the notes folder
    // is available there and synced localstorage with dropbox.

    const [dropboxSetupFailed, setDropboxSetupFailed] = useState(false);

    const showInfo = (infoText, infoDuration, logToConsole = false) => {
        if (logToConsole) {
            console.log('infoText =', infoText, ', infoDuration =', infoDuration);
        }

        setTimeout(() => {
            setInfoText(undefined);
        }, infoDuration * 1000.0);

        setInfoText(infoText);
    };

    const handleTokenSubmit = (accessToken, idToNoteData) => {
        const dbx = new Dropbox({ accessToken, clientId: process.env.REACT_APP_DROPBOX_KEY });
        const p = initDropboxHelper(dbx);

        p.then(() => {
            const p1 = LS.syncWithDropbox(LS.idToNoteData);
            p1.then(() => {
                console.log('setup dropbox complete');
                setDropboxSetupComplete(true);
                showInfo('Dropbox setup complete', 2.0);
            }).catch(error => {
                console.log('Failed to sync with dropbox - ', error);
            });
        }).catch(err => {
            console.log(err);
            setDropboxSetupFailed(true);
            showInfo('Failed to set up Dropbox', 2.0);
        });
    };

    return (
        <BrowserRouter>
            <Switch>
                <Route
                    path="/dropbox_oauth"
                    render={() => {
                        if (dropboxSetupComplete) {
                            return <Redirect to="/editor" />;
                        } else if (dropboxHelper.isInitialized() && !dropboxSetupFailed) {
                            // Means we have created the api but have not finished setting up the notes folder on dropbox side.
                            // Disabling handleTokenSubmit.
                            return <DropboxLogin idToNoteData={LS.idToNoteData} />;
                        }
                        // User didn't click submit token button
                        return (
                            <>
                                <DropboxLogin
                                    handleTokenSubmit={handleTokenSubmit}
                                    idToNoteData={LS.idToNoteData}
                                />
                            </>
                        );
                    }}
                />
                <Route
                    path="/"
                    render={({ location }) => (
                        <>
                            <Paper elevation={0}>
                                <Tabs
                                    indicatorColor="primary"
                                    textColor="primary"
                                    value={getTabValue(location.pathname)}
                                    centered
                                >
                                    <Tab
                                        value="editor"
                                        label="Editor"
                                        component={Link}
                                        to="/editor"
                                    />
                                    <Tab
                                        value="notes"
                                        label="Saved notes"
                                        component={Link}
                                        to="/saved_notes"
                                    />
                                </Tabs>
                            </Paper>
                            <Switch>
                                <Route path="/saved_notes" render={() => <NotesPage />} />
                                <Route
                                    path="/editor/:videoId"
                                    render={({ match }) => {
                                        const { videoId } = match.params;
                                        if (videoId) {
                                            setLastVideoId(videoId);
                                        }

                                        return (
                                            <EditorPage
                                                key={videoId}
                                                ytAPI={ytAPI}
                                                startingVideoId={videoId}
                                                showInfo={showInfo}
                                            />
                                        );
                                    }}
                                />
                                <Route
                                    path="/editor"
                                    render={() => {
                                        if (lastVideoId)
                                            return <Redirect to={`/editor/${lastVideoId}`} />;

                                        return <EditorPage ytAPI={ytAPI} />;
                                    }}
                                />

                                {/* Redirect to dropbox oauth token input page otherwise */}
                                <Route
                                    path="/"
                                    render={props => <Redirect to={'/dropbox_oauth/'} />}
                                />
                            </Switch>
                        </>
                    )}
                />
            </Switch>
        </BrowserRouter>
    );
};

const App = () => (
    <MuiThemeProvider theme={theme}>
        <SnackbarContextProvider>
            <LoadYouTubeIFrameAPI>
                {({ ytAPI }) =>
                    ytAPI ? (
                        <div className="app">
                            <Main ytAPI={ytAPI} />
                        </div>
                    ) : (
                        <div>Couldn't load YouTube API</div>
                    )
                }
            </LoadYouTubeIFrameAPI>
        </SnackbarContextProvider>
    </MuiThemeProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
