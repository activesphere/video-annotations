import AppConfig from '../src/AppConfig';

// The inject script is wrapped in an immediately called function so that it can be clicked multiple
// times in the same page and JS doesn't complain about redefining the same variable. The user can
// after all click multiple times by mistake.
(function() {
    const VID_ANNOT_ROOT_ID = '__vid_annot_root__';
    const CANVAS_ID = '__image_destination_canvas__';

    // Port to background script
    let port = null;

    // Canvas. Created only in the youtube iframe to store the current video frame and get a dataURI.
    let canvasRef = null;

    let canvasContext = null;

    let isInVidAnnotApp = false;

    // Returns reference to the destination canvas used to store the image from the video. Creates
    // it if it isn't available.
    function initCanvas(width = 400, height = 300) {
        let canvas = document.getElementById(CANVAS_ID);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = CANVAS_ID;

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
        if (!canvasContext) {
            initCanvas();
        }

        canvasContext.drawImage(videoElement, 0, 0, canvasRef.width, canvasRef.height);
        return canvasRef.toDataURL('image/png');
    }

    function main() {
        // Get the <video> element. A more specific query would be 'better', but I can't seem to get
        // that to work.
        const videoElement = document.querySelector(`video`);

        if (!videoElement) {
            return;
        }

        // Listen for message from main app and do the corresponding thing.
        window.addEventListener(
            'message',
            e => {
                if (e.data.type === AppConfig.CaptureCurrentFrameMessage) {
                    // Send image back to app via postMessage
                    try {
                        const dataUrl = getCurrentFrameURI(videoElement);
                        window.parent.postMessage(
                            { type: AppConfig.CaptureCurrentFrameResponse, dataUrl },
                            '*'
                        );
                    } catch (e) {
                        console.log(e);
                    }
                }

                if (e.data.type == AppConfig.RemovePauseOverlayMessage) {
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
