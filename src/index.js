import React, { useState } from 'react';
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
import dropboxHelper, { initDropboxHelper } from './DropboxHelper';
import * as LS from './LocalStorageHelper';

import theme from './mui_theme';

const getTabValue = path => {
    if (path.indexOf('/editor') === 0) return 'editor';
    if (path.indexOf('/saved_notes') === 0) return 'notes';
    return null;
};

// prettier-ignore
console.log(`Dropbox Key = ${process.env.REACT_APP_DROPBOX_KEY}, Secret=${process.env.REACT_APP_DROPBOX_SECRET}`);

const Main = ({ ytAPI }) => {
    const [lastVideoId, setLastVideoId] = useState(undefined);

    const [dbxSetupState, setDbxSetupState] = useState('pending');

    const handleTokenSubmit = async (accessToken, idToNoteData) => {
        const dbx = new Dropbox({ accessToken, clientId: process.env.REACT_APP_DROPBOX_KEY });

        try {
            await initDropboxHelper(dbx);
            await LS.syncWithDropbox(LS.idToNoteData);
            setDbxSetupState('complete');
        } catch (err) {
            setDbxSetupState('failed');
        }
    };

    return (
        <BrowserRouter>
            <Switch>
                <Route
                    path="/dropbox_oauth"
                    render={() => {
                        if (dbxSetupState === 'complete') return <Redirect to="/editor" />;

                        const syncFailed =
                            dropboxHelper.isInitialized() && dbxSetupState === 'failed';

                        return (
                            <DropboxLogin
                                handleTokenSubmit={syncFailed ? null : handleTokenSubmit}
                                idToNoteData={LS.idToNoteData}
                            />
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
