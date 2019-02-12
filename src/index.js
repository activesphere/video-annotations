import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import NotesPage from './NotesPage';
import * as serviceWorker from './serviceWorker';

const STARTING_TAB_VALUE = 0;

class PageType {
    static EDITOR_PAGE = 0;
    static SAVED_NOTES_PAGE = 1;

    constructor(type, extraState = undefined) {
        this.type = type;
        this.extraState = extraState;
    }
}

function renderTab(selectedTabIndex) {
    switch (selectedTabIndex) {
        case 0:
            ReactDOM.render(
                <App tabIndex={0} onTabChange={onTabChange} />,
                document.getElementById('root')
            );
            break;
        case 1:
            ReactDOM.render(
                <NotesPage tabIndex={1} onTabChange={onTabChange} />,
                document.getElementById('root')
            );
            break;
        default:
            throw new Error('Unexpected tab value - ', selectedTabIndex);
    }
}

function onTabChange(event, selectedTabIndex) {
    renderTab(selectedTabIndex);
}

renderTab(STARTING_TAB_VALUE);

/*

const editorPageWithNote_regex = /notepage_video=(.+)/.compile();
const savedNotesPage_regex = /saved_notes/.compile();

function renderComponentBasedOnHash() {
    const stringAfterHash = window.location.hash;

    let matchObj = editorPageWithNote_regex.exec(stringAfterHash);

    if (matchObj) {
        const videoId = matchObj[1];

        ReactDOM.render(
            <App tabIndex={0} onTabChange={onTabChange} startingVideoId={videoId} />,
            document.getElementById('root')
        );
        return;
    }

    matchObj = savedNotesPage_regex.exec(stringAfterHash);

    if (matchObj) {
        ReactDOM.render(
            <NotesPage tabIndex={1} onTabChange={onTabChange} />,
            document.getElementById('root')
        );
        return;
    }

    console.log('Did not match any hash url');
}

window.addEventListener('hashchange', renderComponentBasedOnHash, false);

*/

serviceWorker.unregister();