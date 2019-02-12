export function secondsToHhmmss(seconds) {
    let remainingSeconds = seconds;

    let hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds = remainingSeconds % 3600;

    let minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;

    return `${hours}:${minutes}:${remainingSeconds.toFixed(0)}`;
}

export function makeYoutubeUrl(videoId, videoTimeInSeconds) {
    if (!videoTimeInSeconds) {
        return `http://www.youtube.com/watch?v=${videoId}`;
    }

    // Seconds to mmss
    let remainingSeconds = videoTimeInSeconds;
    let minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;
    const mmss = `${minutes}m${remainingSeconds.toFixed(0)}s`;
    return `http://www.youtube.com/watch?v=${videoId}&t=${mmss}`;
}

export function makeYoutubeImageUrl(videoId, imageNumber = 1) {
    if (!videoId) {
        return '';
    }
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export const TEST_VIDEO_ID = '495nCzxM9PI';

/*
export function shortenStringEllipsis(fullString, maxLength = 10) {
    const len = fullString.length;

    if (len <= maxLength) {
        return fullString;
    }
    const ellipsis = ' ... ';
    const remainingLength = len - ellipsis.length;

    if (remainingLength < 0) {
        return '';
    }
    const s = [];

    for (let i = 0; i < (maxLength / 2); ++i) {

    }
}
*/