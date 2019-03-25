// listen for our browerAction to be clicked
browser.browserAction.onClicked.addListener(tab => {
    // for the current tab, inject the "inject.js" file & execute it
    console.log('Inserting script in tab', tab);
    browser.tabs.executeScript(tab.id, {
        file: 'inject.js',
        allFrames: true,
    });
});

browser.runtime.onConnect.addListener(port => {
    if (port.name !== 'vid-annot-port') {
        console.log('Got connection from unexpected port -', port);
        return;
    }
    console.log('Connection at port', port);
    port.onMessage.addListener(msg => {
        console.log('Received message ', msg);
    });
});
