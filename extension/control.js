import ns from './browser_namespace';
import AppConfig from '../src/AppConfig';

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
        return;
    }

    if (markPageAsInspected()) {
        return;
    }

    window.addEventListener('message', m => {
        if (m.data.type === AppConfig.LoadInjectScriptMessage) {
            State.port.postMessage({ command: 'SHOULD_LOAD_INJECT_SCRIPT' });
        }
    });

    State.port = ns.runtime.connect({ name: 'VID_ANNOT_CONTROL_SCRIPT_PORT' });
    State.port.postMessage({ type: 'IS_VID_ANNOT_APP' });
}
