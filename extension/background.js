/*
Only one vid-annot instance is allowed to run. Otherwise it's undefined what will happen.

Two content scripts for better understanding.

1. control.js - Per page. Loaded by background script. Checks if the vid-annot app is running in the
page, if so it loads the worker.js script (via background script). It also listens to
AppConfig.LoadControlScript message from the app and does the above thing.

2. worker.js - All frame capture related thing is handled by the worker.js script.

background.js - The single background script simply loads control.js and loads worker.js when
control.js tells it to.

*/

import ns from './browser_namespace';

function connectedToControlScriptPort(p) {
    p.onMessage.addListener(m => {
        console.log('Received message', m);

        switch (m.command) {
            case 'SHOULD_LOAD_INJECT_SCRIPT': {
                console.log('Loading inject script');
                ns.tabs.executeScript(p.sender.tab.id, {
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
