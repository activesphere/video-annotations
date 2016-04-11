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
    'click .editor-minimized': 'restoreEditor',
  },

  initialize: function (options) {

    // jscs: disable
    this.start_seconds = 0;//second
    // jscs: enable
    this.isQuickAnnotation = false;
    this.videoTag = options.videoTag;
    this.videoFrame = options.videoFrame;
  },

  render: function () {
    this.$el.html(this.template());
    this.$el.find('.editor-minimized').css('display', 'none');
    this.$el.css({ right: '5px', top:  '5px' });
    return this;
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

  cancel: function (e) {
    if (typeof e !== 'undefined') {
      e.preventDefault();
    }

    this.videoTag.play();
    this.clear();
  },

  hideEditor: function () {
    this.$el.find('.annotation-editor').css('display', 'none');
    this.$el.find('.editor-minimized').css('display', 'block');
    this.$el.css('width', '20px');
    this.videoTag.play();
  },

  restoreEditor: function () {
    this.$el.find('.annotation-editor').css('display', 'block');
    this.$el.find('.editor-minimized').css('display', 'none');
    this.$el.css('width', '480px');
    this.videoTag.pause();
  },

  clear: function () {
    this.$el.detach();
  }
});

export default NewAnnotationView;
