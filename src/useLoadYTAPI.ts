import { useEffect, useState } from 'react';

const appendYouTubeScript = (cb: (ytAPI: any) => void) => {
  const apiScriptElement = document.createElement('script');
  apiScriptElement.src = 'https://www.youtube.com/iframe_api';
  apiScriptElement.id = '__iframe_api__';

  document.body.appendChild(apiScriptElement);

  // @ts-ignore
  window.onYouTubeIframeAPIReady = () => cb(window.YT);
};

const useLoadYTAPI = () => {
  const [ytAPI, setAPI] = useState();
  const [isLoading, setLoading] = useState(true);

  const onLoad = (api: any) => {
    setLoading(false);
    setAPI(api);
  };

  useEffect(() => {
    appendYouTubeScript(onLoad);
  }, []);

  return { ytAPI, isLoading };
};

export default useLoadYTAPI;
