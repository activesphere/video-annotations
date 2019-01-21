document.addEventListener('DOMContentLoaded', event => {
    // Add the message listener from the background script
    chrome.runtime.onMessage.addListener(message => {
        console.log('My content script received a message', message);
        if (message.type === 'activateVideoAnnotator') {
            // Dish out the app

            // First attempt. Just create a dialog and run your whole react app in it using an
            // iframe.

            document.body.innerHTML += `
        <dialog style="height:40%">
        	<iframe id="__app_iframe__"style="height:100%"></iframe>
           	<div style="position:absolute; top:0px; left:5px;">  
           	<button id="__close_iframe_button__">x</button>
           	</div>
        </dialog>
        `;

            const iframe = document.getElementById('__app_iframe__');
            if (!iframe) {
                throw new Error('Failed to getElementById __app_iframe__');
            }

            iframe.src = chrome.extension.getURL('index.html');
            iframe.frameBorder = 0;
        }
    });
});
