import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import LoadYouTubeIFrameAPI from './LoadYouTubeIFrameAPI';
import { AppBar, Toolbar, Typography, Paper, Tabs, Tab } from '@material-ui/core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';
import { Transition, TransitionGroup, CSSTransition } from 'react-transition-group';

import theme from './mui_theme';

const editorPageStateBeforeRoutingAway = {
    videoId: undefined,
};

function saveLastEditorPageState(videoId) {
    editorPageStateBeforeRoutingAway.videoId = videoId;
}

function pathToLastEditorPage() {
    const lastVideoId = editorPageStateBeforeRoutingAway.videoId || '';
    return `/editor/${lastVideoId}`;
}

function makeEditorPageWithYtApi(ytAPI) {
    const component = props => {
        const { match, location } = props;
        console.assert(!!match, 'Editor page not being rendered via a Route component?');
        console.assert(!!location, 'Editor page not being rendered via a Route component?');
        console.log('location =', location);
        return (
            <EditorPage
                key={match.params.videoId}
                ytAPI={ytAPI}
                startingVideoId={match.params.videoId}
                saveLastEditorPageState={saveLastEditorPageState}
            />
        );
    };
    return component;
}

const TabBar = ({ activeIndex }) => {
    return (
        <Paper>
            <Tabs indicatorColor="primary" textColor="primary" value={activeIndex} centered>
                <Tab label="Editor" component={Link} to={pathToLastEditorPage()} />
                <Tab label="Saved notes" component={Link} to={'/saved_notes'} />
            </Tabs>
        </Paper>
    );
};

const withFooter = (WrappedPageComponent, indexOfThisPage) => {
    return propsForWrappedPage => (
        <Fragment>
            <TabBar activeIndex={indexOfThisPage} />
            <WrappedPageComponent {...propsForWrappedPage} />
        </Fragment>
    );
};

class PageIndices {
    static EDITOR_PAGE = 0;
    static SAVED_NOTES_PAGE = 1;
}

const Main = ({ ytAPI }) => {
    if (!ytAPI) {
        return null;
    }

    // Wrapping editor page in a function component that will save the editor page's video id
    // before creating the page component itself.
    const withSaveVideoId = EditorPageToWrap => {
        const Wrapped = routeProps => {
            editorPageStateBeforeRoutingAway.videoId = routeProps.match.params.videoId;
            return <EditorPageToWrap {...routeProps} />;
        };
        Wrapped.displayName = `withSaveVideoId_${EditorPage.displayName || 'unnamed'}`;
        return Wrapped;
    };

    const WrappedEditorPage = withSaveVideoId(
        withFooter(makeEditorPageWithYtApi(ytAPI), PageIndices.EDITOR_PAGE)
    );

    const NotesPageWithFooter = withFooter(NotesPage, PageIndices.SAVED_NOTES_PAGE);

    return (
        <BrowserRouter>
            <Switch>
                <Route exact path="/" render={WrappedEditorPage} />
                <Route exact path="/editor" render={WrappedEditorPage} />
                <Route path="/editor/:videoId" render={WrappedEditorPage} />
                <Route path="/saved_notes" render={NotesPageWithFooter} />
            </Switch>
        </BrowserRouter>
    );
};

const App = () => (
    <MuiThemeProvider theme={theme}>
        <LoadYouTubeIFrameAPI>
            {({ ytAPI }) => (
                <div className="app">
                    <Main ytAPI={ytAPI} />
                </div>
            )}
        </LoadYouTubeIFrameAPI>
    </MuiThemeProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
