import $ from 'jquery';
import Mustache from 'mustache.js';

export default class AnnotationsVisual {
  constructor(options) {
    this.annotations = options.annotations;
    this.videoTag = options.videoTag;
    this.annotationsHeightObj = {};
  }

  renderVisuals() {
    $('#video-annotation').append(Mustache.to_html($('#close-annotation-visual-template').html()));

    this.quickAnnotationBase = this.videoTag.getControlsHeight() + 8;

    const sortedAnnotations = this.annotations.sortBy('start_seconds');
    sortedAnnotations.forEach(this.renderAnnotations.bind(this, false));
    sortedAnnotations.forEach(this.renderAnnotations.bind(this, true));
  }

  renderAnnotations(isQuickAnnotation, annotation, index, sortedAnnotations) {
    annotation = annotation.toJSON();

    if (isQuickAnnotation && annotation.end_seconds) {
      return;
    } else if (!isQuickAnnotation && !annotation.end_seconds) {
      return;
    }

    const controlsHeight = this.videoTag.getControlsHeight();
    const startTimeObj = this.getTime(annotation.start_seconds);
    const endTimeObj = annotation.end_seconds ? this.getTime(annotation.end_seconds) : {};

    // jscs: disable
    $('#video-annotation').append(Mustache.to_html($('#annotation-visual-template').html(), {
      title: annotation.title,
      id: annotation.id,
      startMinutes: startTimeObj.minutes,
      startSeconds: startTimeObj.seconds,
      endMinutes: endTimeObj.minutes,
      endSeconds: endTimeObj.seconds,
      end_seconds: annotation.end_seconds
    }));
    // jscs: enable

    let $annotationVisual = $('#' + annotation.id);
    let bottom = this.getBottom(annotation, index, sortedAnnotations, isQuickAnnotation);

    let visualPosition = this.videoTag.getSeekerPosition(annotation.start_seconds);

    // shift position to approximately centre the quick annotation visual around start_seconds
    visualPosition = annotation.end_seconds ? visualPosition : visualPosition - 3;

    // jscs: disable
    $annotationVisual.css({ bottom: bottom + 'px',
      left: this.videoTag.getSeekerPosition(annotation.start_seconds) + 'px' });
    // jscs: enable

    const startPos = this.videoTag.getSeekerPosition(annotation.start_seconds);
    const endPos = annotation.end_seconds ?
                    this.videoTag.getSeekerPosition(annotation.end_seconds) :
                    undefined;

    $('.' + annotation.id).each(function () {
      if ($(this).hasClass('start-time')) {
        $(this).css('left', startPos - 5).css(
          'bottom', controlsHeight + 'px');
      }
    });

    if (endPos) {
      $('.' + annotation.id).each(function () {
        if ($(this).hasClass('end-time')) {
          $(this).css('left', endPos - 5).css(
            'bottom', controlsHeight + 'px');
        }
      });
    }

    if (annotation.end_seconds) {
      const annotationDuration = annotation.end_seconds - annotation.start_seconds;
      const width = annotationDuration * this.videoTag.getPixelsPerSecond();
      $annotationVisual.css('width', width + 'px');
      $annotationVisual.click(this.highlightAnnotation);
    } else {
      $annotationVisual.addClass('quick-annotation-visual');
    }

    this.bindMouseEvents(annotation, $annotationVisual);
  }

  getBottom(annotation, index, sortedAnnotations, isQuickAnnotation) {
    const paddingToBase = 8;
    let bottom = isQuickAnnotation ? this.quickAnnotationBase + paddingToBase :
                    this.videoTag.getControlsHeight() + paddingToBase;

    const step = 10;

    const isSlotAvailable = (bottom, index, sortedAnnotations, isQuickAnnotation) => {
      for (let i = 0; i < index; i++) {
        let prevAnnotation = sortedAnnotations[i];
        if (!isQuickAnnotation || !prevAnnotation.get('end_seconds')) {
          if (prevAnnotationTooClose(annotation, prevAnnotation)) {
            if (bottom === this.annotationsHeightObj[prevAnnotation.get('id')]) {
              return false;
            }
          }
        }
      }

      return true;
    };

    const prevAnnotationTooClose = (annotation, prevAnnotation) => {
      if (annotation.end_seconds) {
        return prevAnnotation.get('end_seconds') > annotation.start_seconds;
      }

      return this.prevAnnotationTooClose(annotation, prevAnnotation);
    };

    while (!isSlotAvailable(bottom, index, sortedAnnotations, isQuickAnnotation)) {
      bottom += step;
    }

    this.annotationsHeightObj[annotation.id] = bottom;
    if (!isQuickAnnotation) {
      this.quickAnnotationBase = bottom > this.quickAnnotationBase ? bottom :
        this.quickAnnotationBase;
    }

    return bottom;
  }

  prevAnnotationTooClose(annotation, prevAnnotation) {

    const quickAnnotationWidth = 7;

    const annotationStartPos = this.videoTag.getSeekerPosition(annotation.start_seconds);

    const prevAnnotationStartPos = this.videoTag.
                                    getSeekerPosition(prevAnnotation.get('start_seconds'));

    return annotationStartPos - prevAnnotationStartPos < quickAnnotationWidth;
  }

  bindMouseEvents(annotation, $annotationVisual) {

    const onEnter = (e) => {

      let $target = $(e.target);
      $target.addClass('focused');

      $target.find('.time-display').removeClass('hide');

      let $visuals = $('.annotation-visual');

      $visuals.each(function () {
        if ($(this).hasClass('focused') || $(this).hasClass('time-display')) {
          return;
        }

        $(this).addClass('faded-visual');
      });

      const id = '.' + $target.attr('id');
      $(id).each(function () {
        if ($(this).hasClass('annotation-visual-chevron')) {
          $(this).removeClass('hide');
        }
      });
    };

    const onLeave = (e) => {
      var $target = $(e.target);
      if (!$target.hasClass('annotation-visual')) {
        $target = $target.parents('.annotation-visual');
      }

      $target.removeClass('focused');
      $target.find('.time-display').addClass('hide');

      $('.annotation-visual').removeClass('faded-visual');

      $('.annotation-visual-chevron').addClass('hide');
    };

    $annotationVisual.click(this.highlightAnnotation);
    $annotationVisual.hover(onEnter, onLeave);
  }

  highlightAnnotation(e) {
    const id = '.' + $(e.target).attr('id');

    var $sidebar = $('.sidebar');
    if ($sidebar.hasClass('sidebar-hidden')) {
      $sidebar.removeClass('sidebar-hidden').addClass('sidebar-visible');
      $sidebar.css('right', '0px');
      $sidebar.find('.caret').removeClass('fa-caret-left').addClass('fa-caret-right');
    }

    $(id).find('.annotation-description').show();
    $(id).find('.icon-title').
      removeClass('fa-caret-right').
      addClass('fa-caret-down');
  }

  getTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.floor(totalSeconds % 60);
    return { minutes: minutes, seconds: seconds };
  }

  removeAnnotationsVisual() {
    if ($('#video-annotation').find('.annotation-visual').length) {
      $('#video-annotation').find('.annotation-visual').remove();
      $('#video-annotation').find('.remove-visual').remove();
    }
  }
}
