import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import LoadYouTubeIFrameAPI from './LoadYouTubeIFrameAPI';
import { Paper, Tabs, Tab } from '@material-ui/core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter, Switch, Route, Link, Redirect } from 'react-router-dom';
import InfoPopper from './InfoPopper';
import { createOauthFlow } from 'react-oauth-flow';

import DropboxLogin from './DropboxLogin';

import theme from './mui_theme';

const getTabValue = path => {
    if (path.indexOf('/editor') === 0) return 'editor';
    if (path.indexOf('/saved_notes') === 0) return 'notes';
    return null;
};

// prettier-ignore
console.log(`Dropbox Key = ${process.env.REACT_APP_DROPBOX_KEY}, Secret=${process.env.REACT_APP_DROPBOX_SECRET}`);

const { Sender, Receiver } = createOauthFlow({
    authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    clientId: process.env.REACT_APP_DB_KEY,
    clientSecret: process.env.REACT_APP_DB_SECRET,
    redirectUri: 'http://localhost:3000/auth/dropbox',
});

const rootElement = document.getElementById('root');

const Main = ({ ytAPI }) => {
    const [lastVideoId, setLastVideoId] = useState(null);
    const [infoText, setInfoText] = useState(undefined);

    const showInfo = (infoText, infoDuration, logToConsole = false) => {
        if (logToConsole) {
            console.log('infoText =', infoText, ', infoDuration =', infoDuration);
        }

        setTimeout(() => {
            setInfoText(undefined);
        }, infoDuration * 1000.0);

        setInfoText(infoText);
    };

    return (
        <BrowserRouter>
            <Route
                path="/"
                render={({ location }) => (
                    <>
                        <Paper>
                            <Tabs
                                indicatorColor="primary"
                                textColor="primary"
                                value={getTabValue(location.pathname)}
                                centered
                            >
                                <Tab value="editor" label="Editor" component={Link} to="/editor" />
                                <Tab
                                    value="notes"
                                    label="Saved notes"
                                    component={Link}
                                    to="/saved_notes"
                                />
                            </Tabs>
                        </Paper>
                        <InfoPopper anchorElement={infoText ? rootElement : undefined}>
                            {infoText}
                        </InfoPopper>
                        <Switch>
                            <Route path="/saved_notes" component={NotesPage} />
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

                            <Route
                                path="/db_login"
                                render={() => {
                                    const handleSubmitFunc = accessToken => {
                                        console.log('Access token given =', accessToken);
                                    };

                                    return <Redirect to={'/editor'} />;
                                }}
                            />

                            {/* Redirect to dropbox oauth token input page otherwise */}
                            <Route path="/" render={props => <Redirect to={'/db_login/'} />} />
                        </Switch>
                    </>
                )}
            />
        </BrowserRouter>
    );
};

const App = () => (
    <MuiThemeProvider theme={theme}>
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
    </MuiThemeProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
