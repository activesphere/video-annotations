import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'lib/jquery.hotkeys.js';
import Mustache from 'mustache.js';

import Utils from 'utils.js';
import Annotation from 'backbone/models.js';
import Annotations from 'backbone/collections.js';

var NewAnnotationView = Backbone.View.extend({
  tagName: 'div',
  className: 'create-annotation',
  template: function () {
    return $('#new-annotation-template').html();
  },

  events: {
    'keyup textarea.annotation_text': 'createByEvent',
    'click a.create': 'createByClick',
    'click a.cancel': 'cancel',
  },

  initialize: function (options) {
    this.startSeconds = 0;//second
    this.thatSeconds = false;
    this.videoTag = options.videoTag;
    this.resize();
  },

  render: function () {
    this.$el.html(this.template());
    this.$el.css('width', '160px');
    this.$el.css('height', '109px');
    this.updatePosition();
    return this;
  },

  createByEvent: function (event) {
    if (event.keyCode == 13 && event.altKey) {
      this.createAnnotation(event.target.value);
    }
  },

  createByClick: function (event) {
    event.preventDefault();
    var value = $(event.target).siblings('textarea')[0].value;
    this.createAnnotation(value);
  },

  createAnnotation: function (value) {
    console.log('Trigged');
    var uid = Date.now();
    var endSeconds = parseInt(this.videoTag.currentTime);
    var annotationObj = _.extend({
      id: uid,
      startSeconds: this.startSeconds,
      endSeconds: endSeconds,
    }, Utils.splitAnnotation(value));

    // TODO: what does thatSeconds mean
    if (this.thatSeconds) {
      annotationObj.startSeconds = endSeconds;
      annotationObj.endSeconds = null;
      this.thatSeconds = false;
    } else {
      this.startSeconds = endSeconds;
    }

    var annotationModel = new Annotation(annotationObj);
    Annotations.add(annotationModel);

    this.videoFrame.set('startSeconds', this.startSeconds);
    this.videoTag.play();
    this.$el.attr({ style: 'right: 0px;top: 0px' });
    this.clear();
  },

  cancel: function (e) {
    e.preventDefault();
    this.videoTag.play();
    this.$el.attr({ style: 'right: 0px;top: 0px' });
    this.clear();
  },

  clear: function () {
    this.$el.detach();
  },

  updatePosition: function () {
    if (this.$el.find('textarea.annotation_text')) {
      var position = Utils.getNewAnnotationPosition(this.videoTag, this.$el);

      this.$el.css({
          right: position.right + 'px',
          top: position.top + 'px',
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
