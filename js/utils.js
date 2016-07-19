import _ from 'lodash';
import $ from './vendor/jquery.hotkeys.js';
import Dropbox from './dropbox_chrome.js';
import DropboxFile from './dropboxUtils.js';
import config from './config';

const Utils = {};

Utils.minuteSeconds = function minuteSeconds(time) {
  let newTime = '';
  if (time !== null) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - (minutes * 60));
    if (minutes) {
      newTime = `${minutes}m ${seconds}s`;
    } else {
      newTime = `${seconds}s`;
    }
  }
  return newTime;
};

Utils.hosts = {
  'www.youtube.com': 'youtube',
  'www.coursera.com': 'coursera',
};

Utils.dropbox = function dropbox(videoKey) {
  const dropboxChrome = new Dropbox.Chrome({
    key: config.dropbox.key,
  });
  return new DropboxFile({
    dropboxObj: dropboxChrome,
    name: videoKey,
  });
};

Utils.splitAnnotation = function splitAnnotation(annotation) {
  const list = annotation.split('\n');
  const title = list.shift();
  const description = _.compact(list).join('\n');
  return { title, description, annotation };
};

Utils.base64Url = function base64Url(rCurrentUrl) {
  const currentUrl = rCurrentUrl.href.split('#')[0];
  return btoa(
    encodeURIComponent(currentUrl)
      .replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode(`0x${p1}`)
      )
  );
};

Utils.getVideoKey = function getVideoKey() {
  const currentUrl = window.location;
  return this.base64Url(currentUrl);
};

Utils.userInfo = 'dropbox_userinfo';

const PROVIDER_INFO = {
  'www.youtube.com': {
    parentContainer: '.player-api',
    controlsHeight: 41,
    paddingForSeeker: 12,
  },
  default: {
    controlsHeight: 39,
    paddingForSeeker: 0,
  },
};

Utils.getVideoInfo = function getVideoInfo(host) {
  switch (host) {
    case 'youtube':
      return {
        videoTitle: $('title').text(),
        provider: 'youtube',
      };
    case 'coursera':
      return {
        videoTitle: $('title').text(),
        provider: 'coursera',
      };
    default:
      return {
        videoTitle: $('title').text(),
        provider: 'Unknown',
      };
  }
};

Utils.daysPassed = function daysPassed(since) {
  return Math.round(
    (new Date() - new Date(since)) / (1000 * 60 * 60 * 24)
  );
};

Utils.getVideoInterface = function getVideoInterface() {
  function getProvider() {
    const host = window.location.host;
    return PROVIDER_INFO[host] || PROVIDER_INFO.default;
  }

  function getVideoContainer() {
    const defaultContainer = $('video').parent();
    const provider = getProvider();
    return provider.parentContainer ?
           $('video').parents(provider.parentContainer) : defaultContainer;
  }

  function buildProxy(container, player, provider) {
    const videoMethodsObject = {
      // cant use a getter method for currentTime as getters are memoized
      // js
      getCurrentTime: () => player.currentTime,
      setCurrentTime: (time) => {
        player.currentTime = time;
      },

      get duration() {
        return player.duration;
      },

      isPaused: () => player.paused,
      play: () => player.play(),
      pause: () => player.pause(),

      togglePlayback() {
        if (this.isPaused()) {
          this.play();
        } else {
          this.pause();
        }
        return undefined;
      },

      seekForth() { return this.setCurrentTime(this.getCurrentTime() + 5); },
      seekBack() { return this.setCurrentTime(this.getCurrentTime() - 5); },
      seek(direction) {
        if (direction === 'forward') {
          this.seekForth();
        } else if (direction === 'backward') {
          this.seekBack();
        }
      },

      getControlsHeight: () => provider.controlsHeight,
      getPixelsPerSecond: () =>
        (container.width() - provider.paddingForSeeker * 2) / player.duration,

      getSeekerPosition(time) {
        if (typeof time === 'undefined') {
          return provider.paddingForSeeker +
                 parseInt(player.currentTime, 10) * this.getPixelsPerSecond();
        }

        return provider.paddingForSeeker + time * this.getPixelsPerSecond();
      },

      player,
    };
    
    Object.assign(container, videoMethodsObject);
    return container;
  }

  return buildProxy(getVideoContainer(), $('video')[0], getProvider());
};

Utils.getNewAnnotationPosition = function newPosition($targetEl) {
  const videoTag = Utils.getVideoInterface();
  const heightOfChevron = 8;

  // get height and width from video container instead of video tag as certain
  // videos have video tags smaller than the video container and thus the progress
  // bar is wider than the video element itself.
  // eg. https://www.youtube.com/watch?v=0ax_PBfrCG8
  const videoTagWidth = videoTag.width();

  const inputWidth = $targetEl.outerWidth();
  const inputCentrePos = inputWidth / 2;

  const seekerPosition = videoTag.getSeekerPosition();

  const isSeekerLeft = seekerPosition <= inputCentrePos;
  const isSeekerRight = (seekerPosition + inputCentrePos) >= videoTagWidth;

  function getRight() {
    if (isSeekerLeft) {
      return videoTagWidth - inputWidth;
    } else if (isSeekerRight) {
      return 0;
    }
    return videoTagWidth - seekerPosition - inputCentrePos;
  }

  function getChevronLeft() {
    if (isSeekerLeft) {
      return { left: `${seekerPosition}px` };
    } else if (isSeekerRight) {
      const left = inputWidth - (videoTagWidth - seekerPosition);
      return { left: `${left}px` };
    }
    return { left: '50%' };
  }

  return {
    bottom: videoTag.getControlsHeight() + heightOfChevron,
    right: getRight(),
    chevronLeft: getChevronLeft(),
  };
};

export default Utils;
