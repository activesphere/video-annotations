import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import EditorPage from './EditorPage';
import NotesPage from './NotesPage';
import historyPushListener from './historyPushListener';

import * as serviceWorker from './serviceWorker';

const regexEditorPage = new RegExp('^/editor(/([^/]*))?/?$');
const regexSavedNotesPage = new RegExp('^/saved_notes/?$');

const editorPageStateBeforeRoutingAway = {
    videoId: undefined,
};

function saveLastEditorPageState(videoId) {
    editorPageStateBeforeRoutingAway.videoId = videoId;
}

function renderPageBasedOnLocation() {
    const path = window.location.pathname;
    // Match the path and see which page to open

    console.log('new location.pathname = ', path);

    let match = regexEditorPage.exec(path);

    if (match) {
        console.log('Matched editor page path');
        let videoId = undefined;
        
        if (match[0] && match[2]) {
            // We have a video id
            videoId = match[2];
            console.log('videoId = ', videoId);
        }

        ReactDOM.render(
            <EditorPage
                tabIndex={0}
                afterHistoryPushState={renderPageBasedOnLocation}
                startingVideoId={videoId}
                saveLastEditorPageState={saveLastEditorPageState}
            />,
            document.getElementById('root')
        );
        return;
    }

    match = regexSavedNotesPage.exec(path);

    if (match) {
        ReactDOM.render(
            <NotesPage tabIndex={1} afterHistoryPushState={renderPageBasedOnLocation} />,
            document.getElementById('root')
        );

        return;
    }

    console.log('No match, opening editor page...');
    ReactDOM.render(
        <EditorPage
            tabIndex={0}
            afterHistoryPushState={renderPageBasedOnLocation}
            saveLastEditorPageState={saveLastEditorPageState}
            startingPopperMessage={'No route matched, opened editor page'}
        />,
        document.getElementById('root')
    );
}

renderPageBasedOnLocation();

serviceWorker.unregister();
