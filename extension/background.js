import ns from './browser_namespace';

const State = {
    // On click, should first load the controller script
    shouldLoadControllerScript: false,

    controlScriptPort: null,

    // Which tab the content script was injected. If closed, we reset the background scripts state
    tabId: null,
    windowId: null,
};

function connectedToControlScriptPort(p) {
    State.controlScriptPort = p;
    State.controlScriptPort.onMessage.addListener(m => {
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

ns.runtime.onConnect.addListener(connectedToControlScriptPort);

function onTabUpdated(tabId, changeInfo, tabInfo) {
    console.log(
        'va-extension: background.js - tabInfo =',
        tabInfo,
        'changeInfo.status and tabInfo.url =',
        changeInfo.status,
        tabInfo.url
    );

    if (changeInfo.status === 'complete') {
        console.log('Loading content script in tab with url -', tabInfo.url);
        // Load the control script
        ns.tabs.executeScript(tabId, {
            file: 'control.bundled.js',
        });
    }
}

/*
function onNewTabCreated(tab) {
    console.log('va-extension: background.js - Loading control.js into tab', tab.id);

    ns.tabs.executeScript(tab.id, {
        file: 'control.bundled.js',
    });
}
*/

console.log('va-extension: background.js - Installed');
ns.tabs.onUpdated.addListener(onTabUpdated);
