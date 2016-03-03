import _ from 'lodash';
import $ from 'lib/jquery.hotkeys.js';

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

Utils.getVideoInterface = function () {
  function getVideoContainer() {
    var host = window.location.host;
    var defaultContainer = $('video').parent();
    var hostContainers =  {
      'www.youtube.com': $('video').parents('.player-api')
    };

    return hostContainers[host] || defaultContainer;
  }

  function buildProxy(container, player) {
    var videoMethodsObject = {
      // cant use a getter method for currentTime as getters are memoized
      // js
      getCurrentTime: function () {
        return player.currentTime;
      },

      /* jshint -W078 */
      set currentTime(time) {
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
      }

    };
    _.extend(container, videoMethodsObject);
    return container;
  }

  return buildProxy(getVideoContainer(), $('video')[0]);
};

Utils.getNewAnnotationPosition =  function ($targetEl) {
  var videoTag = Utils.getVideoInterface();
  var heightOfChevron = 6;

  // heigtht of video controls + progress bar + paddings + their borders and paddings
  var videoControlsHeight = 57;
  var paddingForSeeker = 12;

  // get height and width from video container instead of video tag as certain
  // videos have video tags smaller than the video container and thus the progress
  // bar is wider than the video element itself.
  // eg. https://www.youtube.com/watch?v=0ax_PBfrCG8
  var videoTagHeight = videoTag.height();
  var videoTagWidth = videoTag.width();

  var totalDuration = videoTag.duration;
  var currentDuration = videoTag.getCurrentTime();

  var inputHeight = $targetEl.height() + heightOfChevron;
  var inputWidth = $targetEl.outerWidth();
  var inputCentrePos = inputWidth / 2;

  var pixelsPerSecond = (videoTagWidth - paddingForSeeker * 2) / totalDuration;
  var seekerPosition = currentDuration * pixelsPerSecond;

  var isSeekerLeft = seekerPosition <= inputCentrePos;
  var isSeekerRight = (seekerPosition + inputCentrePos) >= videoTagWidth;

  function getTop() {
    return (videoTagHeight - inputHeight) - videoControlsHeight;
  }

  function getRight() {
    if (isSeekerLeft) {
      return videoTagWidth - inputWidth;
    } else if (isSeekerRight) {
      return 0;
    } else {
      return videoTagWidth - seekerPosition - paddingForSeeker - inputCentrePos;
    }
  }

  function getChevronLeft() {
    if (isSeekerLeft) {
      return { left: seekerPosition + paddingForSeeker + 'px' };
    } else if (isSeekerRight) {
      return { left: inputWidth - (videoTagWidth - seekerPosition - paddingForSeeker) + 'px' };
    } else {
      return { left:  '50%' };
    }
  }

  return { top: getTop(), right: getRight(), chevronLeft: getChevronLeft() };
};

export default Utils;
