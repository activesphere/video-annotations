import ns from './browser_namespace';
import AppConfig from '../src/AppConfig';

console.log('control.js: Loaded');

const State = {
    port: null,
};

State.port = ns.runtime.connect({ name: 'VID_ANNOT_CONTROL_SCRIPT_PORT' });

console.log('State.port =', State.port);

window.addEventListener('message', m => {
    if (m.data.type === AppConfig.LoadInjectScriptMessage) {
        console.log('control.js: Telling bg script to load inject script');
        State.port.postMessage({ command: 'SHOULD_LOAD_INJECT_SCRIPT' });
    }
});
