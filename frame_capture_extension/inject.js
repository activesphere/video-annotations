(function() {
    // Returns reference to the destination canvas used to store the image from the video. Creates
    // it if it isn't available.
    const getCanvasElement = (width = 400, height = 300) => {
        const canvasId = '__image_destination_canvas__';

        let canvas = document.getElementById(canvasId);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = canvasId;

            // Just for now. Will not be showing the canvas to user.
            canvas.style.position = 'fixed';
            canvas.style.top = 0;
            canvas.style.right = 0;

            document.body.appendChild(canvas);
        }

        canvas.width = width;
        canvas.height = height;
        return canvas;
    };

    const captureToCanvas = (canvasRef, videoRef) => {
        const C = canvasRef.getContext('2d');
        C.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);
    };

    console.log('Beginning injection');

    const iframeId = '__yt_iframe__';

    // just place a div at top right

    /*
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = 0;
    div.style.right = 0;
    div.textContent = 'Entered the document...';
    document.body.appendChild(div);
    console.log('inserted self...');
    */

    const canvasRef = getCanvasElement();

    // Get the <video>

    const videoElements = document.getElementsByTagName('video');

    if (!videoElements || videoElements.length == 0) {
        return;
    }

    const videoRef = videoElements[0];

    videoRef.addEventListener('playing', () => {
        console.log('Capturing to canvas');
        captureToCanvas(canvasRef, videoRef);
    });

    const strVideoElementInfo = JSON.stringify(videoElements[0], ['id', 'className', 'tagName']);

    // Send a message to the background script
    const port = browser.runtime.connect({ name: 'vid-annot-port' });
    port.postMessage(strVideoElementInfo);
    port.onMessage.addListener(msg => {});
})();
