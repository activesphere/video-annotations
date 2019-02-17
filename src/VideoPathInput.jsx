import React, { useCallback } from 'react';
import getYouTubeID from 'get-youtube-id';

const isYouTubeID = str => str && str.length === 11;

const VideoPathInput = () => {
    const onChange = useCallback(e => {
        const { value } = e.target;

        const videoId = isYouTubeID(value) ? value : getYouTubeID(value);

        if (!videoId) {
            return;
        }

        window.history.pushState({ videoId }, '', `/editor/${videoId}`);
    });

    return (
        <div className="youtube-id-input">
            <input
                id="youtube_video_input"
                type="text"
                placeholder="Paste video id or path here"
                onChange={onChange}
                spellCheck="false"
            />
        </div>
    );
};

export default VideoPathInput;
