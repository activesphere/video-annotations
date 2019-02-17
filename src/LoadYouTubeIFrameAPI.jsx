import React, { useEffect, useState } from 'react';

const appendYouTubeScript = cb => {
    const apiScriptElement = document.createElement('script');
    apiScriptElement.src = 'https://www.youtube.com/iframe_api';
    apiScriptElement.id = '__iframe_api__';

    document.body.appendChild(apiScriptElement);

    window.onYouTubeIframeAPIReady = () => cb(window.YT);
};

const LoadYouTubeIFrameAPI = ({ children }) => {
    const [ytAPI, setAPI] = useState();
    useEffect(() => {
        appendYouTubeScript(setAPI);
    }, []);

    return children({ ytAPI });
};

export default LoadYouTubeIFrameAPI;
