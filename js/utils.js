var Utils = {};

(function() {
  Utils.minuteSeconds = function (time){
    if (time != null){
      minutes = Math.floor(time / 60);
      seconds = Math.floor(time - (minutes * 60));
      time = minutes + '.' + seconds;
    }
    return time;
  };

  Utils.hosts = (function(){
    return {
      "www.youtube.com": "youtube",
      "www.coursera.com": "coursera"
    }
  })();

  Utils.splitAnnotation = function(annotation){
    var list = annotation.split('\n');
    var title = list.shift();
    var description = _.compact(list).join('\n');
    return {title: title, description: description, annotation: annotation};
  };

  Utils.userInfo = 'dropbox_userinfo';

  Utils.getNewAnnotationPosition =  function (videoTag, $targetEl) {
    var heightOfChevron = 6;
    // heigtht of video controls + progress bar + paddings + their borders and paddings
    var videoControlsHeight = 57;
    var paddingForSeeker = 12;

    var videoTagHeight = $(videoTag).height();
    var videoTagWidth = $(videoTag).width();

    var totalDuration = videoTag.duration;
    var currentDuration = videoTag.currentTime;

    var inputHeight = $targetEl.height() + heightOfChevron;
    var inputWidth = $targetEl.outerWidth();
    var inputCentrePos = inputWidth / 2;

    var pixelsPerSecond = (videoTagWidth - paddingForSeeker * 2) / totalDuration;
    var seekerPosition = currentDuration * pixelsPerSecond;

    var chevronEl = $targetEl.find(".chevron");

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
        return {"left": seekerPosition + paddingForSeeker + "px"};
      } else if (isSeekerRight) {
        return {"left": inputWidth - (videoTagWidth - seekerPosition - paddingForSeeker) + "px"};
      } else {
        return {"left":  "50%"};
      }
    }

    return {top: getTop(), right: getRight(), chevronLeft: getChevronLeft()};
  };
})();
