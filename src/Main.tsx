import React, { useState } from 'react';
import { Paper, Tabs, Tab } from '@material-ui/core';
import { BrowserRouter, Switch, Route, Link, Redirect } from 'react-router-dom';

import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import DropboxSyncButton from './DropboxSyncButton';
import AppBar from './AppBar';

const getTabValue = (path: string) => {
  if (path.indexOf('/editor') === 0) return 'editor';
  if (path.indexOf('/saved_notes') === 0) return 'notes';
  return null;
};

const Main = ({ ytAPI }: { ytAPI: any }) => {
  const [lastVideoId, setLastVideoId] = useState(null);

  if (!ytAPI) return null;

  return (
    <BrowserRouter>
      <Switch>
        <Route
          path="/"
          render={({ location }) => (
            <>
              <AppBar location={location} />
              <Switch>
                <Route path="/saved_notes" render={() => <NotesPage />} />
                <Route
                  path="/editor/:videoId"
                  render={({ match }) => {
                    const { videoId } = match.params;
                    if (videoId) {
                      setLastVideoId(videoId);
                    }

                    return <EditorPage key={videoId} ytAPI={ytAPI} startingVideoId={videoId} />;
                  }}
                />
                <Route
                  path="/editor"
                  render={() => {
                    if (lastVideoId) return <Redirect to={`/editor/${lastVideoId}`} />;

                    return <EditorPage ytAPI={ytAPI} />;
                  }}
                />

                <Route path="/" render={() => <Redirect to="/saved_notes" />} />
              </Switch>
            </>
          )}
        />
      </Switch>
    </BrowserRouter>
  );
};

export default Main;
