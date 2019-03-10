import React from 'react';

const style = {
    color: '#9ebdff',
    textDecoration: 'underline',
    fontStyle: 'italic',
    cursor: 'pointer',
};

const TimestampMark = ({ mark, children, attributes, parentApp }) => {
    const videoId = mark.data.get('videoId');
    const videoTime = mark.data.get('videoTime');

    const seekToTime = () => {
        parentApp.doVideoCommand('seekToTime', {
            videoId,
            videoTime,
        });
    };

    return (
        <span
            onClick={seekToTime}
            className="inline-youtube-timestamp"
            {...attributes}
            style={style}
        >
            {children}
        </span>
    );
};

export default TimestampMark;
