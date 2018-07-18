import {Controller} from 'stimulus';
import youtubeRegex from 'youtube-regex';
import hotkeys from 'hotkeys-js';
import formatTime from '../lib/format-time.js';
import storage from '../lib/storage.js';
import throttle from '../lib/throttle.js';
import {MarkdownEditor} from './markdown-editor.js';

hotkeys.filter = function (event) {
	const {tagName} = (event.target || event.srcElement);
	return tagName === 'DIV';
};

export default class extends Controller {
	initialize() {
		this.player = undefined;
		this.playerState = -1;

		this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
		this.initializePlayer = this.initializePlayer.bind(this);
		this.togglePlay = this.togglePlay.bind(this);
		this.appendTimeStamp = this.appendTimeStamp.bind(this);
		this.save = throttle(this.save.bind(this), 3000);
		this.seekTo = this.seekTo.bind(this);
		this.jump10sForward = this.jump10sForward.bind(this);
		this.jump10sBackward = this.jump10sBackward.bind(this);
		this.mkEditor = new MarkdownEditor('');
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
			if (this.mkEditor.content.length === 0) {
				this.mkEditor.content = `# ${title}\n`;
				this.mkEditor.focus();
			}
		}
		this.playerState = event.data;
	}

	connect() {
		const videoUrl = new URL(document.location.href).searchParams.get('url');
		if (videoUrl && videoUrl !== '') {
			const id = youtubeRegex().exec(videoUrl).reverse()[0];
			this.id = id;
			this.initializePlayer(id);
			this.initializeKeyboardShortcuts();
			console.log(`id: ${id}`);
			const value = storage.get(id);
			if (value) {
				// This.editorTarget.value = value;
				this.mkEditor.content = value;
				console.log(value);
			}
		}
	}

	appendTimeStamp() {
		const ts = formatTime(this.player.getCurrentTime());
		// Const newline = this.mkEditor.content ? '' : '';
		this.mkEditor.addText(`[${ts}](${ts}) `);
		// This.mkEditor.content += `${newline}[${ts}](${ts}) `;
		this.mkEditor.focus();
	}

	togglePlay() {
		const {YT} = window;
		if (this.playerState === YT.PlayerState.PLAYING) {
			this.player.pauseVideo();
		} else {
			this.player.playVideo();
		}
	}

	save() {
		const value = this.mkEditor.content;
		console.log(value);
		if (value !== '') {
			console.log(`Here`);
			storage.set(this.id, value);
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
