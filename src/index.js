import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import NotesPage from "./NotesPage";
// import App from './BabysFirstPopupMenu';
import * as serviceWorker from './serviceWorker';

const STARTING_TAB_VALUE = 0;

function renderTab(value) {
    switch (value) {
        case 0:
            ReactDOM.render(<App onTabChange={onTabChange} />, document.getElementById('root'));
            break;
        case 1:
            ReactDOM.render(<NotesPage onTabChange={onTabChange} />, document.getElementById('root'));
            break;
        case 2:
            ReactDOM.render(<NotesPage onTabChange={onTabChange} />, document.getElementById('root'));
        default:
            throw new Error('Unexpected tab value - ', value);
    }
}

function onTabChange(event, value) {
    renderTab(value);
}

// After switching to modal for notes page, we will render the usual App page first.
renderTab(STARTING_TAB_VALUE);
// ReactDOM.render(<App onTabChange={onTabChange} />, document.getElementById('root'));

serviceWorker.unregister();
