import ns from './browser_namespace';

const State = {
    // On click, should first load the controller script
    shouldLoadControllerScript: true,

    // Port for communicating with currently active controller script
    port: null,

    // Which tab the content script was injected. If closed, we reset the background scripts state
    tabId: null,
    windowId: null,
};

function portListener(p) {
    console.log('Received connection from port -', p);

    if (p.name !== 'VID_ANNOT_CONTROL_SCRIPT_PORT') {
        return;
    }

    State.port = p;

    State.port.onDisconnect;

    State.port.onMessage.addListener(m => {
        console.log('Received message', m);

        switch (m.command) {
            case 'SHOULD_LOAD_INJECT_SCRIPT': {
                console.log('Loading inject script');
                ns.tabs.executeScript(State.tabId, {
                    file: 'worker.bundled.js',
                    allFrames: true,
                });
                break;
            }

            default: {
                console.log('background.js: Unknown message received on port - ', m);
            }
        }
    });
}

// listen for our browerAction to be clicked
ns.browserAction.onClicked.addListener(tab => {
    if (State.shouldLoadControllerScript) {
        State.tabId = tab.id;
        State.windowId = tab.windowId;

        console.log('Loading control script...');

        State.shouldLoadControllerScript = false;

        ns.runtime.onConnect.addListener(portListener);

        ns.tabs.executeScript(tab.id, {
            file: 'control.bundled.js',
            allFrames: true,
        });

        ns.tabs.onRemoved.addListener((tabId, { windowId }) => {
            console.log('tabId = ', tabId, 'windowId =', windowId);
            if (tabId === State.tabId && windowId === State.windowId) {
                console.log('Resetting');
                State.shouldLoadControllerScript = true;

                if (State.port) {
                    State.port.onMessage.removeListener(portListener);
                    State.port.disconnect();
                    State.port = null;
                }

                State.tabId = null;
                State.windowId = null;
            }
        });

        console.log('...Loaded control script');
    } else {
        // TODO: remove this
        console.log('Not loading control script');
    }
});
