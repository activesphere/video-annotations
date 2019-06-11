import AppConfig from '../src/AppConfig';

const toImageData = video => {
    const { offsetWidth: width, offsetHeight: height } = video;
    const c = document.createElement('canvas');
    c.style.position = 'fixed';
    c.style.top = 0;
    c.style.right = 0;
    c.width = width;
    c.height = height;
    const canvasContext = c.getContext('2d');
    canvasContext.drawImage(video, 0, 0, width, height);

    const dataURL = c.toDataURL('image/png');

    c.remove();
    return { dataURL, width, height };
};

const sendVideoDataURL = () => {
    try {
        const video = document.querySelector('video');
        if (!video) return;

        window.parent.postMessage(
            { type: AppConfig.CaptureCurrentFrameResponse, ...toImageData(video) },
            '*'
        );
    } catch (e) {
        console.log(e); // eslint-disable-line no-console
    }
};

const removeVideoOverlay = () => {
    const elements = document.getElementsByClassName('ytp-pause-overlay');
    for (const element of elements) {
        element.parentNode.removeChild(element);
    }
};

const onMessage = e => {
    switch (e.data.type) {
        case AppConfig.CaptureCurrentFrameMessage:
            sendVideoDataURL();
            break;
        case AppConfig.RemovePauseOverlayMessage:
            removeVideoOverlay();
            break;
        default:
    }
};

window.addEventListener('message', onMessage, false);
