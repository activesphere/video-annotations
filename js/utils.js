import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';

var Utils = {};

Utils.minuteSeconds = function (time) {
  if (time !== null) {
    var minutes = Math.floor(time / 60);
    var seconds = Math.floor(time - (minutes * 60));
    time = minutes + '.' + seconds;
  }

  return time;
};

Utils.hosts = (function () {
  return {
    'www.youtube.com': 'youtube',
    'www.coursera.com': 'coursera',
  };
})();

Utils.splitAnnotation = function (annotation) {
  var list = annotation.split('\n');
  var title = list.shift();
  var description = _.compact(list).join('\n');
  return { title: title, description: description, annotation: annotation };
};

Utils.userInfo = 'dropbox_userinfo';

const PROVIDER_INFO = {
  'www.youtube.com': {
    parentContainer: '.player-api',
    controlsHeight: 41,
    paddingForSeeker: 12
  },
  default: {
    controlsHeight: 39,
    paddingForSeeker: 0
  }
};

Utils.getVideoInterface = function () {
  function getProvider() {
    var host = window.location.host;
    return PROVIDER_INFO[host] || PROVIDER_INFO['default'];
  }

  function getVideoContainer() {
    var defaultContainer = $('video').parent();
    var provider = getProvider();
    return provider.parentContainer ?
      $('video').parents(provider.parentContainer) : defaultContainer;
  }

  function buildProxy(container, player, provider) {
    var videoMethodsObject = {
      // cant use a getter method for currentTime as getters are memoized
      // js
      getCurrentTime: function () {
        return player.currentTime;
      },

      setCurrentTime: function (time) {
        player.currentTime = time;
      },

      get duration () {
        return player.duration;
      },

      play: function () {
        return player.play();
      },

      pause: function () {
        return player.pause();
      },

      getControlsHeight: function () {
        return provider.controlsHeight;
      },

      getPixelsPerSecond: function () {
        return (container.width() - provider.paddingForSeeker * 2) / player.duration;
      },

      getSeekerPosition: function () {
        return provider.paddingForSeeker + player.currentTime * this.getPixelsPerSecond();
      }
    };
    _.extend(container, videoMethodsObject);
    return container;
  }

  return buildProxy(getVideoContainer(), $('video')[0], getProvider());
};

Utils.getNewAnnotationPosition =  function ($targetEl) {
  var videoTag = Utils.getVideoInterface();
  var heightOfChevron = 8;

  // get height and width from video container instead of video tag as certain
  // videos have video tags smaller than the video container and thus the progress
  // bar is wider than the video element itself.
  // eg. https://www.youtube.com/watch?v=0ax_PBfrCG8
  var videoTagWidth = videoTag.width();

  var inputWidth = $targetEl.outerWidth();
  var inputCentrePos = inputWidth / 2;

  var seekerPosition = videoTag.getSeekerPosition();

  var isSeekerLeft = seekerPosition <= inputCentrePos;
  var isSeekerRight = (seekerPosition + inputCentrePos) >= videoTagWidth;

  function getRight() {
    if (isSeekerLeft) {
      return videoTagWidth - inputWidth;
    } else if (isSeekerRight) {
      return 0;
    } else {
      return videoTagWidth - seekerPosition - inputCentrePos;
    }
  }

  function getChevronLeft() {
    if (isSeekerLeft) {
      return { left: seekerPosition + 'px' };
    } else if (isSeekerRight) {
      return { left: inputWidth - (videoTagWidth - seekerPosition) + 'px' };
    } else {
      return { left:  '50%' };
    }
  }

  return { bottom: videoTag.getControlsHeight() + heightOfChevron,
    right: getRight(), chevronLeft: getChevronLeft() };
};

export default Utils;
