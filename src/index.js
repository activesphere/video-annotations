import React from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-use';

import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';

const regexEditorPage = new RegExp('^/editor(/([^/]*))?/?$');
const regexSavedNotesPage = new RegExp('^/saved_notes/?$');

const editorPageStateBeforeRoutingAway = {
    videoId: undefined,
};

function saveLastEditorPageState(videoId) {
    editorPageStateBeforeRoutingAway.videoId = videoId;
}

const App = () => {
    const location = useLocation();

    const path = location.pathname;

    let match = regexEditorPage.exec(path);

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
                tabIndex={0}
                startingVideoId={videoId}
                saveLastEditorPageState={saveLastEditorPageState}
            />
        );
    }

    match = regexSavedNotesPage.exec(path);

    if (match) {
        return <NotesPage tabIndex={1} />;
    }

    return (
        <EditorPage
            tabIndex={0}
            saveLastEditorPageState={saveLastEditorPageState}
            startingPopperMessage={'No route matched, opened editor page'}
        />
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
