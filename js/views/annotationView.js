import Backbone from 'backbone';
import Mustache from 'mustache.js';
import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';

import Utils from 'utils.js';
import Annotations from 'collections/collections.js';

var AnnotationView = Backbone.View.extend({
  template: '#annotation-template',
  tagName: 'li',
  className: 'video-annotation',
  events: {
    'click a.delete': 'delete',
    'click a.edit': 'edit',
    'click a.update': 'update',
    'click a.seek': 'seek',
    'click a.cancel-update': 'cancelUpdate',
    'click span.icon-title': 'changeIcon',
  },

  initialize: function (options) {
    _.bindAll(this, 'render');
    this.videoTag = options.videoTag;
    this.model.on('change', this.render);
  },

  render: function () {
    this.secondsToMinutes('start_minutes', 'start_seconds');
    this.secondsToMinutes('end_minutes', 'end_seconds');

    // jscs: disable
    $(this.el)
    .html(Mustache.to_html($(this.template).html(), _.extend(
    // jscs:  enable
      this.model.toJSON())));
    $(this.el).addClass(this.model.get('id') + '');
    return this;
  },

  renderEdit: function (annotation) {
    // jscs: disable
    this.$el.find('.edit-annotation').html(
      Mustache.to_html($('#annotation-edit-template').html(), { annotation: annotation })
      // jscs: enable
    );
  },

  seek: function (e) {
    e.preventDefault();
    if (this.videoTag) {
      this.videoTag.setCurrentTime(this.model.get('start_seconds'));
    }
  },

  secondsToMinutes: function (name, field) {
    var time = this.model.get(field);
    var r = Utils.minuteSeconds(time);
    this.model.set(name, r);
  },

  update: function (e) {
    e.preventDefault();
    var annotation = this.$el.find('textarea')[0].value;
    this.model.set(Utils.splitAnnotation(annotation));
    this.$el.find('.edit-annotation').hide();
    this.$el.find('.annotation-detail').show();
    this.setCaretRight();
  },

  delete: function (e) {
    e.preventDefault();
    var currentModel = Annotations.findWhere(this.model);
    if (currentModel) {
      this.$el.remove();
      Annotations.remove(currentModel);
    }
  },

  edit: function (e) {
    this.setCaretDown();
    e.preventDefault();
    if (!_.isEmpty(this.$el.find('.annotation-description'))) {
      this.$el.find('.annotation-description').hide();
    }

    this.$el.find('.edit-annotation').show();
    this.renderEdit(this.model.get('annotation'));
    this.$el.find('.edit-annotation .edit-annotation-text').focus();
  },

  cancelUpdate: function (e) {
    e.preventDefault();
    this.$el.find('.edit-annotation').hide();
    this.$el.find('.annotation-detail').show();
    this.setCaretRight();
  },

  changeIcon: function (e) {
    if ($(e.target).hasClass('fa fa-caret-right')) {
      //Set type to manual to aviod window close automatally when video playing
      $(e.target).data('type', 'manual');
      this.setCaretDown();
      this.$el.find('.annotation-description').show();
    } else {
      $(e.target).data('type', 'auto');
      this.setCaretRight();
      this.$el.find('.annotation-description').hide();
    }
  },

  setCaretRight: function () {
    this.$el.find('.icon-title').removeClass('fa fa-caret-down').addClass('fa fa-caret-right');
  },

  setCaretDown: function () {
    this.$el.find('.icon-title').removeClass('fa fa-caret-right').addClass('fa fa-caret-down');
  }
});

export default AnnotationView;
