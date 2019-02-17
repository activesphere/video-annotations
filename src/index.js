import React from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-use';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import LoadYouTubeIFrameAPI from './LoadYouTubeIFrameAPI';
import { AppHeader, FooterMenu } from './header_and_footer';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from './mui_theme';

const regexEditorPage = new RegExp('^/editor(/([^/]*))?/?$');
const regexSavedNotesPage = new RegExp('^/saved_notes/?$');

const editorPageStateBeforeRoutingAway = {
    videoId: undefined,
};

function saveLastEditorPageState(videoId) {
    editorPageStateBeforeRoutingAway.videoId = videoId;
}

const MainContent = ({ ytAPI }) => {
    const location = useLocation();

    const path = location.pathname;

    let match = regexEditorPage.exec(path);

    if (!ytAPI) return null;

    if (match) {
        console.log('Matched editor page path');
        let videoId = undefined;

        if (match[0] && match[2]) {
            // We have a video id
            videoId = match[2];
            console.log('videoId = ', videoId);
        }

        return (
            <EditorPage
                key={videoId}
                ytAPI={ytAPI}
                startingVideoId={videoId}
                saveLastEditorPageState={saveLastEditorPageState}
            />
        );
    }

    match = regexSavedNotesPage.exec(path);

    if (match) {
        return <NotesPage />;
    }

    return (
        <EditorPage
            ytAPI={ytAPI}
            saveLastEditorPageState={saveLastEditorPageState}
            startingPopperMessage={'No route matched, opened editor page'}
        />
    );
};

const App = () => (
    <MuiThemeProvider theme={theme}>
        <LoadYouTubeIFrameAPI>
            {({ ytAPI }) => (
                <>
                    <div className="app" id="__app_element__">
                        <AppHeader />
                        <MainContent ytAPI={ytAPI} />
                        <FooterMenu />
                    </div>
                </>
            )}
        </LoadYouTubeIFrameAPI>
    </MuiThemeProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
