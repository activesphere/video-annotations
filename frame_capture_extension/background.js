// listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener(tab => {
    // for the current tab, inject the "inject.js" file & execute it
    console.log('Inserting script in tab', tab);
    chrome.tabs.executeScript(tab.id, {
        file: 'inject.js',
        allFrames: true,
    });
});
