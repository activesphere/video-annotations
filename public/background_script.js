// After the runtime api is loaded, we create a menu entry and set the callback to call when user
// clicks it.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'VideoAnnotator',
        title: 'Annotate youtube videos',
        contexts: ['all'],
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
        console.log('Clicked context menu item');
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            console.log('Query result received, and sending message. Tab(s) = ', tabs);
            chrome.tabs.sendMessage(tabs[0].id, { type: 'activateVideoAnnotator' });
        });
    });
});
