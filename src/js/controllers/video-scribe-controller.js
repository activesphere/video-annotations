import { Controller } from "stimulus";
import youtubeRegex from "youtube-regex";
import formatTime from '../lib/format-time';
import hotkeys from 'hotkeys-js';

hotkeys.filter = function(event) {
	const tagName = (event.target || event.srcElement).tagName;
	return tagName == 'TEXTAREA';
}

export default class extends Controller {
	static targets = [ "editor" ];

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
		tag.src = "//www.youtube.com/iframe_api";
		const firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		let _this = this;

		function onYouTubeIframeAPIReady() {
			_this.player = new YT.Player('video-placeholder', {
				height: '360',
				width: '640',
				videoId: id,
				playerVars: {
					'autoplay': 1,
					'modestbranding': 1,
					'rel': 0,
					'showinfo': 0
					// 'controls': 0
				},
				events: {
					'onReady': onPlayerReady,
					'onStateChange': _this.onPlayerStateChange
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
			const title = this.player.getVideoData().title;
			if (this.editorTarget.value.length == 0) {
				this.editorTarget.value = `# ${title}\n`;
				this.editorTarget.focus();
			}
		}
		this.playerState = event.data;
	}

	connect() {
		const videoUrl = new URL(location.href).searchParams.get('url');
		if (videoUrl && videoUrl !== "") {
			const id = youtubeRegex().exec(videoUrl).reverse()[0];
			this.initializePlayer(id);
			this.initializeKeyboardShortcuts();
		}
	}

	appendTimeStamp(e, handler) {
		const timestamp = formatTime(this.player.getCurrentTime());
		const newline = this.editorTarget.value.length ? "\n\n" : "";
		this.editorTarget.value += `${newline}## /{${timestamp}}/: `;
	}

	togglePlay(e, handler) {
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
		if (this.playerState === YT.PlayerState.PLAYING) {
			this.seekTo(this.player.getCurrentTime() - 10);
		}
	}

	jump10sForward() {
		if (this.playerState === YT.PlayerState.PLAYING) {
			this.seekTo(this.player.getCurrentTime() + 10);
		}
	}
}
