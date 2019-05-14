(function() {
    const YOUTUBE_IFRAME_ID = '__yt_iframe__';
    const VID_ANNOT_ROOT_ID = '__vid_annot_root__';
    const CANVAS_ID = '__image_destination_canvas__';

    // Port to background script
    let port = null;

    // Canvas. Created only in the youtube iframe to store the current video frame and get a dataURI.
    let canvasRef = null;

    let canvasContext = null;

    // Returns reference to the destination canvas used to store the image from the video. Creates
    // it if it isn't available.
    function initCanvas(width = 400, height = 300) {
        let canvas = document.getElementById(CANVAS_ID);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = CANVAS_ID;

            // Just for now. Will not be showing the canvas to user.
            canvas.style.position = 'fixed';
            canvas.style.top = 0;
            canvas.style.right = 0;
            // document.body.appendChild(canvas);
        }
        canvas.width = width;
        canvas.height = height;
        canvasRef = canvas;
        canvasContext = canvasRef.getContext('2d');
    }

    function getCurrentFrameURI(videoElement) {
        canvasContext.drawImage(videoElement, 0, 0, canvasRef.width, canvasRef.height);
        const url = canvasRef.toDataURL('image/png');
        return url;
    }

    function main() {
        // Get the <video> element. A more specific query would be 'better', but I can't seem to get
        // that to work.
        const videoElement = document.querySelector(`video`);

        if (!videoElement) {
            return;
        }

        console.log('Yeah bruh, content script is in frame');

        initCanvas();

        // Listen for message from main app and do the corresponding thing.
        window.addEventListener(
            'message',
            e => {
                if (e.data.type === 'VID_ANNOT_CAPTURE_CURRENT_FRAME') {
                    console.log('Content script received message requesting current frame');

                    // Send image back to app via postMessage
                    try {
                        const dataUrl = getCurrentFrameURI(videoElement);
                        console.log('dataUrl =', dataUrl);
                        window.parent.postMessage(
                            { type: 'VID_ANNOT_CAPTURED_FRAME', dataUrl },
                            '*'
                        );
                    } catch (e) {
                        console.log(e);
                    }
                }

                if (e.data.type == 'VID_ANNOT_REMOVE_PAUSE_OVERLAY') {
                    console.log('Content script received message to remove pause overlay');
                    const elements = document.getElementsByClassName('ytp-pause-overlay');
                    for (const element of elements) {
                        element.parentNode.removeChild(element);
                    }
                }
            },
            false
        );
    }

    main();
})();
