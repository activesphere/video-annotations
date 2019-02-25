import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import LoadYouTubeIFrameAPI from './LoadYouTubeIFrameAPI';
import { AppBar, Toolbar, Typography, Paper, Tabs, Tab } from '@material-ui/core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';

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

// Associates given ytAPI with the EditorPage component since EditorPage is created via react router
// and we can't send it the ytAPI while using react router's `component={EditorPage}`. Pretty sure I can use the
// `render=` prop instead, but just commiting it before I use it since this approach works too.
function makeEditorPageWithYtApi(ytAPI) {
    const component = props => {
        const { match } = props;
        console.assert(!!match, 'Component');
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

export const AppHeader = props => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="display1" color="inherit" gutterBottom={true}>
                    Annotator
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

const FooterMenu = ({ activeIndex }) => {
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
            <WrappedPageComponent {...propsForWrappedPage} />
            <FooterMenu activeIndex={indexOfThisPage} />
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
                <Route exact path="/" component={WrappedEditorPage} />
                <Route exact path="/editor" component={WrappedEditorPage} />
                <Route path="/editor/:videoId" component={WrappedEditorPage} />
                <Route path="/saved_notes" component={NotesPageWithFooter} />
            </Switch>
        </BrowserRouter>
    );
};

const App = () => (
    <MuiThemeProvider theme={theme}>
        <LoadYouTubeIFrameAPI>
            {({ ytAPI }) => (
                <div className="app">
                    <AppHeader />
                    <Main ytAPI={ytAPI} />
                </div>
            )}
        </LoadYouTubeIFrameAPI>
    </MuiThemeProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
