import $ from 'jquery';
import Mustache from 'mustache.js';
import _ from 'lodash';

import Utils from '../../utils.js';

export default class AnnotationMarker {
  constructor(newAnnotation) {
    this.newAnnotation = newAnnotation;
  }

  renderStartMarker(updatePosition) {
    // jscs: disable
    $('#video-annotation').append(Mustache.to_html($('#annotation-start-marker-template').html(),
      {startTime: this.getTime(this.newAnnotation.start_seconds) }));
    // jscs: enable

    var marker = $('#video-annotation').find('.start-marker');

    function onEnter() {
      $('.annotation-marker').css('opacity', '100');
    }

    function onLeave() {
      $('.annotation-marker').css('opacity', '0');
    }

    marker.hover(onEnter, onLeave);

    var position = Utils.getNewAnnotationPosition(marker);

    // jscs: disable
    marker.css({ bottom: position.bottom + 'px',
      left: this.newAnnotation.videoTag.getSeekerPosition(this.newAnnotation.start_seconds) + 'px',
      'z-index': '1000' });
    // jscs: enable
    if (updatePosition) {
      return;
    }

    marker.fadeTo(2000, 0);
  }

  renderEndMarker() {
    // jscs: disable
    $('#video-annotation').append(Mustache.to_html($('#annotation-end-marker-template').html(),
      { startTime: this.getTime(this.newAnnotation.start_seconds),
        endTime: this.getTime(this.newAnnotation.videoTag.getCurrentTime()) }));

    var marker = $('#video-annotation').find('.end-marker');

    var annotationDuration = this.newAnnotation.videoTag.getCurrentTime() - this.newAnnotation.start_seconds;
    var width = annotationDuration * this.newAnnotation.videoTag.getPixelsPerSecond();
    marker.css({ width: width + 'px' });

    var position = Utils.getNewAnnotationPosition(marker);

    marker.css({ bottom: position.bottom + 'px',
      left: this.newAnnotation.videoTag.getSeekerPosition(this.newAnnotation.start_seconds) + 'px' });
    // jscs: enable
    $('#video-annotation').find('.annotation-marker').unbind();
    $('#video-annotation').find('.annotation-marker').css('opacity', '100');
  }

  getTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.floor(totalSeconds % 60);
    return { minutes: minutes, seconds: seconds };
  }

  removeAnnotationMarker() {
    if (!_.isEmpty($('#video-annotation').find('.annotation-marker'))) {
      $('#video-annotation').find('.annotation-marker').remove();
    }
  }
}
