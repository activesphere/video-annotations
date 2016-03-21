import Backbone from 'backbone';
import _ from 'lodash';
import Mustache from 'mustache.js';
import $ from 'vendor/jquery.hotkeys.js';

import Utils from 'utils.js';
import Annotation from 'models/models.js';
import Annotations from 'collections/collections.js';

var NewAnnotationView = Backbone.View.extend({
  tagName: 'div',
  className: 'create-annotation',
  template: function () {
    return $('#new-annotation-template').html();
  },

  events: {
    'keyup textarea.editor': 'createByEvent',
  },

  initialize: function (options) {

    // jscs: disable
    this.start_seconds = 0;//second
    // jscs: enable
    this.isQuickAnnotation = false;
    this.videoTag = options.videoTag;
    this.resize();
  },

  render: function () {
    this.$el.html(this.template());
    this.updatePosition();
    this.unbindEvents();
    this.bindEvents();
    return this;
  },

  createByEvent: function (event) {
    if (event.keyCode === 13 && event.altKey) {
      this.createAnnotation(event.target.value);
    }
  },

  createByClick: function (event) {
    event.preventDefault();
    var value = this.$el.find('textarea')[0].value;
    this.createAnnotation(value);
  },

  createAnnotation: function (value) {
    var uid = Date.now();

    // jscs: disable
    var end_seconds = parseInt(this.videoTag.getCurrentTime());
    var annotationObj = _.extend({
      id: uid,
      start_seconds: this.start_seconds,
      end_seconds: end_seconds,
    }, Utils.splitAnnotation(value));

    if (this.isQuickAnnotation) {
      annotationObj.start_seconds = end_seconds;
      annotationObj.end_seconds = null;
      this.isQuickAnnotation = false;
    } else {
      this.start_seconds = end_seconds;
      // jscs: enable
    }

    var annotationModel = new Annotation(annotationObj);
    Annotations.add(annotationModel);

    // jscs: disable
    this.videoFrame.set('start_seconds', this.start_seconds);
    // jscs: enable
    this.videoTag.play();
    this.clear();
  },

  bindEvents: function () {
    this.$el.find('.annotation-text').bind('keydown', 'esc', this.cancel.bind(this));
  },

  unbindEvents: function () {
    this.$el.find('.annotation-text').unbind('keydown', 'esc', this.cancel.bind(this));
  },

  cancel: function (e) {
    e.preventDefault();
    this.videoTag.play();
    this.clear();
  },

  clear: function () {
    this.$el.detach();
  },

  updatePosition: function () {
    if (this.$el.find('textarea.annotation-text')) {
      this.$el.css({
          right: '5px',
          top:  '5px',
        });
    }
  },

  resize: function () {
    $(window).bind('resize', () => {
      this.updatePosition();
      this.renderStartMarker();
      this.renderEndMarker();
    });
  },

  renderStartMarker: function () {
    // jscs: disable
    $('#video-annotation').append(Mustache.to_html($('#annotation-start-marker-template').html(),
      {startTime: this.getTime(this.start_seconds) }));
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
    marker.css({ opacity: '100', bottom: position.bottom + 'px',
      left: this.videoTag.getSeekerPosition() + 'px' });
    marker.fadeTo(2000, 0);
  },

  renderEndMarker: function () {
    // jscs: disable
    $('#video-annotation').append(Mustache.to_html($('#annotation-end-marker-template').html(),
      { startTime: this.getTime(this.start_seconds),
        endTime: this.getTime(this.videoTag.getCurrentTime()) }));

    var marker = $('#video-annotation').find('.end-marker');

    var annotationDuration = this.videoTag.getCurrentTime() - this.start_seconds;
    var width = annotationDuration * this.videoTag.getPixelsPerSecond();
    marker.css({ width: width + 'px' });

    var position = Utils.getNewAnnotationPosition(marker);

    marker.css({ opacity: '100', bottom: position.bottom + 'px',
      left: this.videoTag.getSeekerPosition(this.start_seconds) + 'px' });
    // jscs: enable
    $('#video-annotation').find('.annotation-marker').unbind();
    $('#video-annotation').find('.annotation-marker').css('opacity', '100');
  },

  getTime: function (totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.floor(totalSeconds % 60);
    return { minutes: minutes, seconds: seconds };
  },

  removeAnnotationMarker: function () {
    if (!_.isEmpty($('#video-annotation').find('.annotation-marker'))) {
      $('#video-annotation').find('.annotation-marker').remove();
    }
  },
});

export default NewAnnotationView;
