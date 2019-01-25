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

export const TEST_VIDEO_ID = '495nCzxM9PI';

export const GIGANTOR_THEME_SONG = `
Gigantor Gigantor Gigantor
Gigantor Gigantor Gigantor
Gigantor the space age robot
He's at your command
Gigantor the space age robot
His power is in your hands
Gigantor the space age robot
He's at your command
Gigantor the space age robot
His power is in your hands
He's bigger than big
Taller than tall
Quicker than quick
Stronger than strong
Ready to fight for right against wrong
Gigantor Gigantor Gigantor
Gigantor Gigantor Gigantor
`.trim();
