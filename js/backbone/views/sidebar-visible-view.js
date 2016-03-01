import Backbone from 'backbone';
import Mustache from 'mustache.js';
import _ from 'lodash';
import $ from 'jquery';

import AnnotationView from 'backbone/views/annotation-view.js';

var SidebarVisibleView = Backbone.View.extend({
  tagName:'div',
  className: 'left_side',
  template: function () {
    return $('#sidebar-visible-template').html();
  },

  noAnnotationTemplate: function () {
    return $('#no-annotation-template').html();
  },

  userInfoTemplate: function () {
    return $('#user-main-template').html();
  },

  events: {
    'keyup input.search_annotations': 'search',
    'click a.close_annotations': 'hideSidebar',
    'click a.sign_in': 'signIn',
    'click a.sign_out': 'signOut',
  },

  initialize: function (options) {
    _.bindAll(this, 'renderList');
    _.bindAll(this, 'syncAnnotations');
    _.bindAll(this, 'renderUserInfo');

    this.arrowTag = options.arrowTag;
    this.storage = options.storage;
    this.dropboxFile = options.dropboxFile;
    this.videoTag =  options.videoTag;
    this.userInfo = options.userInfo;

    this.collection.on('reset', this.renderList);
    this.collection.on('add', this.renderList);
    this.collection.on('remove', this.renderList);

    this.collection.on('reset', this.syncAnnotations);
    this.collection.on('add', this.syncAnnotations);
    this.collection.on('remove', this.syncAnnotations);

    this.userInfo.on('change', this.renderUserInfo);

    this.closeUrl = chrome.extension.getURL('images/close.png');
  },

  render: function () {
    // jscs: disable
    $(this.el).html(Mustache.to_html(this.template(), { closeUrl: this.closeUrl }));
    // jscs: enable
    this.renderList();
    this.renderUserInfo();
    return this;
  },

  renderList: function () {
    this.$el.find('.search_annotations').val('');
    this.$el.find('ul.annotations').empty();
    this.addAll(this.collection.sort('start_seconds'));
  },

  addAll: function (models) {
    var self = this;
    if (!_.isEmpty(models)) {
      _.each(models, function (annotation) { self.addOne(annotation); });
    } else {
      // jscs: disable
      this.$el.find('ul.annotations').html(Mustache.to_html(this.noAnnotationTemplate(),
      // jscs: enable
        { closeUrl: this.closeUrl }));
    }
  },

  addOne: function (annotation) {
    var view = new AnnotationView({ model: annotation, videoTag: this.videoTag });
    this.$el.find('ul.annotations').append(view.render().el);
  },

  search: function (e) {
    var keyword = $(e.target).val();
    var searchResult = this.collection.search(keyword);
    this.$el.find('ul.annotations').empty();
    this.addAll(searchResult);
  },

  hideSidebar: function (event) {
    event.preventDefault();
    this.$el.toggle('slide');
    $(this.arrowTag).fadeIn('slow');
  },

  syncAnnotations: function () {
    this.collection.saveDropbox();
  },

  renderUserInfo: function () {
    var name = this.userInfo.get('display_name');
    var shortName = name && name[0] || 'D';

    // jscs: disable
    this.$el.find('.userInfo_detail')
    .html(Mustache.to_html(this.userInfoTemplate(), _.extend(
    this.userInfo.toJSON(), { shortName: shortName })
    ));
    // jscs: enable
  },

  highlight: function () {
    var self = this;
    if (!self.videoTag.paused  && !_.isEmpty(self.collection.models)) {
      var currentSeconds = parseInt(self.videoTag.currentTime);
      _.each($(self.$el).find('li'), function ($li) {
        //Check if type auto and window opened
        if (($($li).find('span.icon-title').hasClass('fa fa-caret-down') &&
          $($li).find('span.icon-title').data('type') === 'auto' &&
          $($li).find('div.annotation-description').css('display') === 'block')) {

          $($li).find('span.icon-title')
            .removeClass('fa fa-caret-down')
            .addClass('fa fa-caret-right');
          $($li).find('.annotation-description').hide();
        }
      });

      _.each(self.collection.models, function (model) {
        if ((model.get('end_seconds') !== null &&
          currentSeconds >= model.get('start_seconds') &&
          currentSeconds <= model.get('end_seconds')) ||
          model.get('start_seconds') === currentSeconds) {
          self.$el.find('li.' + model.get('id') + ' .icon-title')
            .removeClass('fa fa-caret-right')
            .addClass('fa fa-caret-down');
          self.$el.find('li.' + model.get('id') + ' .annotation-description').show();
        }
      });
    }
  },

  signIn: function (e) {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'signIn' }, function () {
    });
  },

  signOut: function (e) {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'signOut' }, function () {
    });
  },
});

export default SidebarVisibleView;
