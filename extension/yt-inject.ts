import AppConfig from '../src/AppConfig';

const toImageData = (video: any) => {
  const { offsetWidth: width, offsetHeight: height } = video;
  const c = document.createElement('canvas');
  c.style.position = 'fixed';
  c.style.top = '0px';
  c.style.right = '0px';
  c.width = width;
  c.height = height;

  const canvasContext = c.getContext('2d');
  if (canvasContext) {
    canvasContext.drawImage(video, 0, 0, width, height);
  }

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

const onMessage = (e: any) => {
  if (e.data.type === AppConfig.CaptureCurrentFrameMessage) {
    sendVideoDataURL();
  }
};

window.addEventListener('message', onMessage, false);
