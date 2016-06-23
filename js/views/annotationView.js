import Backbone from 'backbone';
import Mustache from 'mustache.js';
import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';
import marked from 'marked';
import SimpleMDE from 'vendor/simplemde.min.js';

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
      this.model.toJSON(), { html: marked(this.model.get('description')) })));
    $(this.el).addClass(this.model.get('id') + '');
    return this;
  },

  renderEditor: function () {
    var id = this.model.get('id') + '';

    // jscs: disable
    this.$el.find('.edit-annotation').html(
      Mustache.to_html($('#annotation-edit-template').html(), {
        id: id,
        className: 'update-annotation',
        function: 'update'
      })
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
    if (typeof e !== 'undefined') {
      e.preventDefault();
    }

    var annotation = this.editor.value();
    this.model.set(Utils.splitAnnotation(annotation));
    this.removeUpdateDiv();
    this.setCaretRight();
    this.$el.find('.icon-title').css('pointer-events', 'all');
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
    if (typeof e !== 'undefined') {
      e.preventDefault();
    }

    this.$el.find('.annotation-description').hide();
    this.renderEditor();
    this.createEditor(this.model.get('annotation'));
    this.setCaretDown();
    this.$el.find('.icon-title').css('pointer-events', 'none');
  },

  createEditor: function (annotation) {
    var id = this.model.get('id') + '';
    this.editor = new SimpleMDE({ element: document.getElementById(id),
      autofocus: true,
    });
    this.editor.codemirror.setOption('extraKeys', {
      Esc: () => this.cancelUpdate(),

      'Alt-Enter': this.update(),

      'Alt-P': () => this.videoTag.togglePlayback(),
      'Alt-[': () => this.videoTag.seek('backward'),
      'Alt-]': () => this.videoTag.seek('forward'),
    });
    this.editor.value(annotation);
  },

  cancelUpdate: function (e) {
    if (typeof e !== 'undefined') {
      e.preventDefault();
    }

    this.setCaretRight();
    this.$el.find('.icon-title').css('pointer-events', 'all');
    this.removeUpdateDiv();
  },

  changeIcon: function (e) {
    if ($(e.target).hasClass('fa-caret-right')) {
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
    this.$el.find('.icon-title').removeClass('fa-caret-down').addClass('fa-caret-right');
  },

  setCaretDown: function () {
    this.$el.find('.icon-title').removeClass('fa-caret-right').addClass('fa-caret-down');
  },

  removeUpdateDiv: function () {
    this.$el.find('.update-annotation').remove();
  }
});

export default AnnotationView;
