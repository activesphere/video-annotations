import Backbone from 'backbone';
import _ from 'lodash';
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
    'keyup textarea.annotation-text': 'createByEvent',
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
    this.$el.css('width', '310px');
    this.$el.css('height', '261px');
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
      var position = Utils.getNewAnnotationPosition(this.$el);

      this.$el.css({
          right: position.right + 'px',
          bottom: position.bottom + 'px',
        });
      this.$el.find('.chevron').css(position.chevronLeft);
    }
  },

  resize: function () {
    var self = this;
    $(window).bind('resize', function () {
      self.updatePosition();
    });
  },
});

export default NewAnnotationView;
