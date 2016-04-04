import Backbone from 'backbone';
import Mustache from 'mustache.js';
import _ from 'lodash';
import $ from 'jquery';

import AnnotationView from 'views/annotationView.js';
import Utils from 'utils.js';
import AppStorage from 'localStorageUtils.js';
import syncingData from 'syncService.js';

var SidebarView = Backbone.View.extend({
  tagName:'div',
  className: 'sidebar',
  template: function () {
    return $('#sidebar-template').html();
  },

  noAnnotationTemplate: function () {
    return $('#no-annotation-template').html();
  },

  userInfoTemplate: function () {
    return $('#user-main-template').html();
  },

  events: {
    'keyup input.search-annotations': 'search',
    'click a.close_annotations': 'hideSidebar',
    'click a.sign_in': 'signIn',
    'click a.sign_out': 'signOut',
    'click i.toggle-info': 'toggleInfo',
    'click  i.toggle-highlight': 'toggleHighlight'
  },

  initialize: function (options) {
    _.bindAll(this, 'renderList');
    _.bindAll(this, 'syncAnnotations');
    _.bindAll(this, 'renderUserInfo');
    this.bindDurationChange();

    this.arrowTag = options.arrowTag;
    this.storage = options.storage;
    this.dropboxFile = options.dropboxFile;
    this.videoTag =  options.videoTag;
    this.userInfo = options.userInfo;

    this.eventPromises = syncingData(this.storage, this.dropboxFile, this.collection, true)
    .then(() => {
      this.collection.on('reset', this.renderList);
      this.collection.on('add', this.renderList);
      this.collection.on('remove', this.renderList);

      this.collection.on('reset', this.syncAnnotations);
      this.collection.on('add', this.syncAnnotations);
      this.collection.on('remove', this.syncAnnotations);
      this.collection.on('change', this.syncAnnotations);
    });

    this.userInfo.on('change', this.renderUserInfo);
    this.registerStorageChange();
  },

  bindDurationChange: function () {
    $('video').on('timeupdate', this.highlight.bind(this));
  },

  unbindDurationChange: function () {
    $('video').unbind('timeupdate');
    this.closeHighlightedDesc();
  },

  render: function () {
    // jscs: disable
    $(this.el).html(Mustache.to_html(this.template()));
    this.renderList();
    this.renderUserInfo();
    this.$el.find('.annotations-list').append(Mustache.to_html($('#extension-info-template').html()));
    this.$el.find('.info').hide();
    // jscs: enable
    return this;
  },

  renderList: function () {
    this.eventPromises.then(() => {
      this.$el.find('.search-annotations').val('');
      this.$el.find('ul.annotations').empty();
      this.addAll(this.collection.sort('start_seconds'));
    });
  },

  addAll: function (models) {
    var self = this;
    if (!_.isEmpty(models)) {
      _.each(models, function (annotation) { self.addOne(annotation); });
    } else {
      // jscs: disable
      this.$el.find('ul.annotations').html(Mustache.to_html(this.noAnnotationTemplate()));
      // jscs: enable
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
    syncingData(this.storage, this.dropboxFile, this.collection);
  },

  renderUserInfo: function () {
    var name = this.userInfo.get('display_name');
    var shortName = name && name[0] || 'D';

    // jscs: disable
    this.$el.find('.user-info')
    .html(Mustache.to_html(this.userInfoTemplate(), _.extend(
    this.userInfo.toJSON(), { shortName: shortName })
    ));
    // jscs: enable
  },

  toggleInfo: function (e) {
    if ($(e.target).hasClass('fa-question')) {
      this.showInfo();
      return;
    }

    this.closeInfo();
  },

  showInfo: function () {
    this.$el.find('.annotations').hide();
    this.$el.find('.fa-container > .toggle-info')
    .removeClass('fa-question')
    .addClass('fa-times')
    .attr('title', 'Close Help');
    this.$el.find('.info').show();
  },

  closeInfo: function () {
    this.$el.find('.info').hide();
    this.$el.find('.fa-container > .toggle-info')
    .removeClass('fa-times close-info')
    .addClass('fa-question show-info')
    .attr('title', 'Show Help');
    this.$el.find('.annotations').show();
  },

  highlight: function () {
    if (!_.isEmpty(this.collection.models)) {

      var currentSeconds = parseInt(this.videoTag.getCurrentTime());

      this.closeHighlightedDesc();

      _.each(this.collection.models, (model) => {
        if ((model.get('end_seconds') !== null &&
          currentSeconds >= model.get('start_seconds') &&
          currentSeconds <= model.get('end_seconds')) ||
          model.get('start_seconds') === currentSeconds) {
          this.$el.find('li.' + model.get('id') + ' .icon-title')
          .removeClass('fa-caret-right')
          .addClass('fa-caret-down');
          this.$el.find('li.' + model.get('id') + ' .annotation-description').show();
        }
      });
    }
  },

  closeHighlightedDesc: function () {
    _.each(this.$el.find('li'), function (li) {
      var $li = $(li);

      //Check if type auto and window opened
      if (($li.find('.icon-title').hasClass('fa-caret-down') &&
        $li.find('.icon-title').data('type') === 'auto' &&
        $li.find('div.annotation-description').css('display') === 'block')) {

        $li.find('.icon-title')
        .removeClass('fa-caret-down')
        .addClass('fa-caret-right');

        $li.find('.annotation-description').hide();
      }
    });
  },

  toggleHighlight: function (e) {
    var $target = $(e.target);
    if ($target.hasClass('fa-check-square-o')) {
      this.unbindDurationChange();
      $target.removeClass('fa-check-square-o').addClass('fa-square-o');
      return;
    }

    this.bindDurationChange();
    $target.removeClass('fa-square-o').addClass('fa-check-square-o');
  },

  fetchUser: function () {
    var userStorage = new AppStorage({ name: Utils.userInfo });
    userStorage.get((userInfo) => {
      if (_.isEmpty(userInfo)) {
        this.userInfo.clear();
      } else {
        this.userInfo.set(userInfo);
        syncingData(this.storage, this.dropboxFile, this.collection, true);
      }

      this.renderUserInfo();
    });
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

  registerStorageChange: function () { //when changes happen in storage, this get trigger
    chrome.storage.onChanged.addListener((changes) => {
      for (var key in changes) {
        if (key === Utils.userInfo) {
          this.fetchUser();
        }
      }
    });
  }
});

export default SidebarView;
