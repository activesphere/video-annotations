// TODO: Get rid of all these logs. The thing the script is doing is not complicated at all.
(function() {
    const YOUTUBE_IFRAME_ID = '__yt_iframe__';
    const VID_ANNOT_ROOT_ID = '__vid_annot_root__';
    const CANVAS_ID = '__image_destination_canvas__';

    console.log('Called inject.js');

    // TODO: Not needed.
    let gScriptIsInIframe = false;
    let gScriptIsInAppRoot = false;

    // Port to background script
    let port = null;

    // Canvas. Created only in the youtube iframe to store the current video frame and get a dataURI.
    let canvasRef = null;

    // Returns reference to the destination canvas used to store the image from the video. Creates
    // it if it isn't available.
    function getCanvasElement(width = 400, height = 300) {
        let canvas = document.getElementById(CANVAS_ID);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = CANVAS_ID;

            port.postMessage(JSON.stringify({ type: 'logging', text: `1` }));

            // Just for now. Will not be showing the canvas to user.
            canvas.style.position = 'fixed';
            canvas.style.top = 0;
            canvas.style.right = 0;
            // document.body.appendChild(canvas);
        }
        canvas.width = width;
        canvas.height = height;
        canvasRef = canvas;
        return canvas;
    }

    function getCurrentFrameURI(canvasRef, videoElement) {
        // TODO: create a single context. don't re-create over and over.
        const C = canvasRef.getContext('2d');
        C.drawImage(videoElement, 0, 0, canvasRef.width, canvasRef.height);
        port.postMessage(JSON.stringify({ type: 'logging', text: 'Drew image on canvas' }));

        const url = canvasRef.toDataURL('image/png');
        // console.log(url);
        return url;
    }

    function sendImageToApp(dataUrl) {
        window.parent.postMessage({ type: 'VID_ANNOT_CAPTURED_FRAME', dataUrl }, '*');
    }

    function main() {
        // Get the <video> element.
        const videoElement = document.querySelector(`video`);

        if (videoElement) {
            gScriptIsInIframe = true;
            // Send a message to the background script
            port = browser.runtime.connect({ name: 'vid_annot_port' });
            port.postMessage(JSON.stringify({ type: 'logging', text: 'Found video element' }));
        } else {
            const vidAnnotRootElement = document.querySelector(`#${VID_ANNOT_ROOT_ID}`);
            if (vidAnnotRootElement) {
                gScriptIsInAppRoot = true;
                port = browser.runtime.connect({ name: 'vid_annot_port' });
                port.postMessage(JSON.stringify({ type: 'logging', text: 'Found app root' }));
            }
        }

        if (!port) {
            return;
        }

        if (gScriptIsInIframe) {
            console.log('Yeah bruh, script is in frame');

            port.postMessage(
                JSON.stringify({ type: 'logging', text: 'Adding event listener on video play' })
            );

            window.addEventListener(
                'message',
                e => {
                    if (e.data.type === 'VID_ANNOT_CAPTURE_CURRENT_FRAME') {
                        console.log('VID_ANNOT_CAPTURE_CURRENT_FRAME received by content script');
                        const dataUrl = getCurrentFrameURI(getCanvasElement(), videoElement);
                        sendImageToApp(dataUrl);
                    }
                },
                false
            );

            /*
            videoElement.addEventListener('playing', () => {
                port.postMessage(
                    JSON.stringify({
                        type: 'logging',
                        text: `Video is being played`,
                    })
                );

                const dataUrl = getCurrentFrameURI(getCanvasElement(), videoElement);
                sendImageToApp(dataUrl);
            });
            */
        }
    }

    main();
})();
