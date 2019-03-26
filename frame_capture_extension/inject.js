(function() {
    const YOUTUBE_IFRAME_ID = '__yt_iframe__';
    const VID_ANNOT_ROOT_ID = '__vid_annot_root__';
    const CANVAS_ID = '__image_destination_canvas__';

    console.log('Called inject.js');

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

            // TODO: Don't append to body. Keep hidden.
            // document.body.appendChild(canvas);
            port.postMessage(JSON.stringify({ type: 'logging', text: `2` }));
        }
        canvas.width = width;
        canvas.height = height;
        port.postMessage(JSON.stringify({ type: 'logging', text: `3` }));
        canvasRef = canvas;
        return canvas;
    }

    function getCurrentFrameURI(canvasRef, videoElement) {
        // TODO: create a single context. don't re-create over and over.
        port.postMessage(JSON.stringify({ type: 'logging', text: `4` }));
        const C = canvasRef.getContext('2d');
        port.postMessage(JSON.stringify({ type: 'logging', text: `5` }));
        C.drawImage(videoElement, 0, 0, canvasRef.width, canvasRef.height);
        port.postMessage(JSON.stringify({ type: 'logging', text: `6` }));
        port.postMessage(JSON.stringify({ type: 'logging', text: 'Drew image on canvas' }));

        const url = canvasRef.toDataURL('image/png');
        console.log('data url =', url);
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
            videoElement.addEventListener('playing', () => {
                port.postMessage(
                    JSON.stringify({
                        type: 'logging',
                        text: `Video is being played`,
                    })
                );

                console.log('Before getting the data url');
                const dataURI = getCurrentFrameURI(getCanvasElement(), videoElement);
                port.postMessage(
                    JSON.stringify({
                        type: 'logging',
                        text: `Video being played, frame image dataURI = ${dataURI}`,
                    })
                );
                console.log('FUCKING... KILL!!!');
                port.postMessage(JSON.stringify({ type: 'logging', text: `7` }));
                const msg = { type: 'captured_frame', dataURI };
                port.postMessage(JSON.stringify(msg));
            });
        }
    }

    main();
})();
