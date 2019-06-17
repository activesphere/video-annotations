import { useEffect, useState } from 'react';

const appendYouTubeScript = cb => {
    const apiScriptElement = document.createElement('script');
    apiScriptElement.src = 'https://www.youtube.com/iframe_api';
    apiScriptElement.id = '__iframe_api__';

    document.body.appendChild(apiScriptElement);

    window.onYouTubeIframeAPIReady = () => cb(window.YT);
};

const useLoadYTAPI = () => {
    const [ytAPI, setAPI] = useState();
    const [isLoading, setLoading] = useState(true);

    const onLoad = api => {
        setLoading(false);
        setAPI(api);
    };

    useEffect(() => {
        appendYouTubeScript(onLoad);
    }, []);

    return { ytAPI, isLoading };
};

export default useLoadYTAPI;
