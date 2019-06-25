import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import AppBar from './AppBar';

const Main = ({ ytAPI }: { ytAPI: any }) => {
  if (!ytAPI) return null;

  return (
    <BrowserRouter>
      <AppBar />
      <Switch>
        <Route
          path="/v/:videoId"
          render={({
            match: {
              params: { videoId },
            },
          }) => <EditorPage key={videoId} ytAPI={ytAPI} startingVideoId={videoId} />}
        />
        <Route path="/" component={NotesPage} />
      </Switch>
    </BrowserRouter>
  );
};

export default Main;
