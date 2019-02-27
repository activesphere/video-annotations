import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import LoadYouTubeIFrameAPI from './LoadYouTubeIFrameAPI';
import { Paper, Tabs, Tab } from '@material-ui/core';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';

import theme from './mui_theme';

const editorPageStateBeforeRoutingAway = {
    videoId: undefined,
    videoTime: undefined,
};

function saveLastEditorPageState(videoId, videoTime) {
    console.log('Saving last editor page state with id = ', videoId, 'time = ', videoTime);
    editorPageStateBeforeRoutingAway.videoId = videoId;
    editorPageStateBeforeRoutingAway.videoTime = videoTime;
}

function pathToLastEditorPage() {
    const lastVideoId = editorPageStateBeforeRoutingAway.videoId || '';
    const lastVideoTime = editorPageStateBeforeRoutingAway.videoTime;
    const path =
        lastVideoId && lastVideoId
            ? `/editor/${lastVideoId}/${Math.floor(lastVideoTime)}`
            : `/editor/${lastVideoId}`;

    console.log('Editor path =', path);
    return path;
}

function makeEditorPageWithYtApi(ytAPI) {
    const component = props => {
        const { match } = props;
        console.assert(!!match, 'Editor page not being rendered via a Route component?');

        let { videoId, videoTime } = match.params;
        console.log('Match.params = ', match.params);

        videoTime = parseInt(videoTime);
        if (isNaN(videoTime)) {
            videoTime = 0;
        }

        console.log('makeEditorPageWithYtApi - videoTime =', videoTime, 'videoId =', videoId);

        return (
            <EditorPage
                key={match.params.videoId}
                ytAPI={ytAPI}
                startingVideoId={videoId}
                startingVideoTime={videoTime}
                saveLastEditorPageState={saveLastEditorPageState}
            />
        );
    };
    return component;
}

const TabBar = ({ classes, activeIndex }) => {
    return (
        <Paper elevation={0}>
            <Tabs indicatorColor="primary" textColor="primary" value={activeIndex} centered>
                <Tab label="Editor" component={Link} to={pathToLastEditorPage()} />
                <Tab label="Saved notes" component={Link} to={'/saved_notes'} />
            </Tabs>
        </Paper>
    );
};

const withTabBar = (WrappedPageComponent, indexOfThisPage) => {
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
            return <EditorPageToWrap {...routeProps} />;
        };
        Wrapped.displayName = `withSaveVideoId_${EditorPage.displayName || 'unnamed'}`;
        return Wrapped;
    };

    const WrappedEditorPage = withSaveVideoId(
        withTabBar(makeEditorPageWithYtApi(ytAPI), PageIndices.EDITOR_PAGE)
    );

    const NotesPageWithFooter = withTabBar(NotesPage, PageIndices.SAVED_NOTES_PAGE);

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/editor/:videoId/:videoTime" component={WrappedEditorPage} />
                <Route path="/editor/:videoId" component={WrappedEditorPage} />
                <Route path="/editor" component={WrappedEditorPage} />
                <Route path="/saved_notes" component={NotesPageWithFooter} />
                <Route path="/" component={NotesPageWithFooter} />
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
