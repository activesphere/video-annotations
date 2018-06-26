import {Controller} from 'stimulus';
import youtubeRegex from 'youtube-regex';
import hotkeys from 'hotkeys-js';
import formatTime from '../lib/format-time.js';

hotkeys.filter = function (event) {
	const {tagName} = (event.target || event.srcElement);
	return tagName === 'TEXTAREA';
};

export default class extends Controller {
	initialize() {
		this.player = undefined;
		this.playerState = -1;

		this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
		this.initializePlayer = this.initializePlayer.bind(this);
		this.togglePlay = this.togglePlay.bind(this);
		this.appendTimeStamp = this.appendTimeStamp.bind(this);
		this.seekTo = this.seekTo.bind(this);
		this.jump10sForward = this.jump10sForward.bind(this);
		this.jump10sBackward = this.jump10sBackward.bind(this);
	}

	initializeKeyboardShortcuts() {
		hotkeys('shift+ctrl+i', this.appendTimeStamp);
		hotkeys('shift+ctrl+space', this.togglePlay);
		hotkeys('shift+ctrl+h', this.jump10sBackward);
		hotkeys('shift+ctrl+l', this.jump10sForward);
	}

	initializePlayer(id) {
		const tag = document.createElement('script');
		tag.src = '//www.youtube.com/iframe_api';
		const firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		const _this = this;

		function onYouTubeIframeAPIReady() {
			const {YT} = window;
			_this.player = new YT.Player('video-placeholder', {
				height: '360',
				width: '640',
				videoId: id,
				playerVars: {
					autoplay: 1,
					modestbranding: 1,
					rel: 0,
					showinfo: 0
					// 'controls': 0
				},
				events: {
					onReady: onPlayerReady,
					onStateChange: _this.onPlayerStateChange
				}
			});
		}

		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

		function onPlayerReady(event) {
			event.target.playVideo();
		}
	}

	onPlayerStateChange(event) {
		if (this.playerState === -1) {
			const {title} = this.player.getVideoData();
			if (this.editorTarget.value.length === 0) {
				this.editorTarget.value = `# ${title}\n`;
				this.editorTarget.focus();
			}
		}
		this.playerState = event.data;
	}

	connect() {
		const videoUrl = new URL(document.location.href).searchParams.get('url');
		if (videoUrl && videoUrl !== '') {
			const id = youtubeRegex().exec(videoUrl).reverse()[0];
			this.initializePlayer(id);
			this.initializeKeyboardShortcuts();
		}
	}

	appendTimeStamp() {
		const ts = formatTime(this.player.getCurrentTime());
		const newline = this.editorTarget.value.length ? '\n\n' : '';
		this.editorTarget.value += `${newline}[${ts}](${ts}) `;
	}

	togglePlay() {
		const {YT} = window;
		if (this.playerState === YT.PlayerState.PLAYING) {
			this.player.pauseVideo();
		} else {
			this.player.playVideo();
		}
	}

	seekTo(seconds) {
		this.player.seekTo(seconds);
	}

	jump10sBackward() {
		const {YT} = window;
		if (this.playerState === YT.PlayerState.PLAYING) {
			this.seekTo(this.player.getCurrentTime() - 10);
		}
	}

	jump10sForward() {
		const {YT} = window;
		if (this.playerState === YT.PlayerState.PLAYING) {
			this.seekTo(this.player.getCurrentTime() + 10);
		}
	}
}

Controller.targets = ['editor'];
