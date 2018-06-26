export default function formatTime(time) {
	time = Math.round(time);

	var minutes = Math.floor(time / 60),
	seconds = time - minutes * 60;

	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;

	return minutes + ":" + seconds;
};
