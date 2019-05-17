import ns from './browser_namespace';
import AppConfig from '../src/AppConfig';

console.log('control.js: Loaded');

const State = {
    port: null,
};

// Control script is loaded after tab's status is 'complete'. So this it's ok to just do the thing
// we want to do immediately.
main();

// Inject an empty div into the document to mark this page as inspected. Returns true if page was
// already marked, otherwise returns false.
function markPageAsInspected() {
    const contentScriptLoaded = document.getElementById('__content_script_div__');

    if (!contentScriptLoaded) {
        const markerElement = document.createElement('div');
        markerElement.id = '__content_script_div__';
        document.body.appendChild(markerElement);
        return false;
    }

    return true;
}

function main() {
    console.log('control.js: main()');
    const root = document.getElementById(AppConfig.VidAnnotRootId);
    if (!root) {
        console.log('va-extension: control.js - Page is not vid-annot app. So not doing anything.');
        return;
    }

    if (markPageAsInspected()) {
        console.log('va-extension: control.js - Page is already marked. Not doing anything.');
        return;
    }

    console.log('va-extension: control.js - Marked page. Loading worker.js');

    window.addEventListener('message', m => {
        if (m.data.type === AppConfig.LoadInjectScriptMessage) {
            console.log('control.js: Telling bg script to load inject script');
            State.port.postMessage({ command: 'SHOULD_LOAD_INJECT_SCRIPT' });
        }
    });

    State.port = ns.runtime.connect({ name: 'VID_ANNOT_CONTROL_SCRIPT_PORT' });
    State.port.postMessage({ type: 'IS_VID_ANNOT_APP' });
}
