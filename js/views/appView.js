import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';
import Dropbox from 'dropbox_chrome.js';
import Mustache from 'mustache.js';

import Utils from 'utils.js';
import DropboxFile from 'dropboxUtils.js';
import {Frame, UserInfo} from 'models/models.js';
import AppStorage from 'localStorageUtils.js';
import Annotations from 'collections/collections.js';
import SidebarView from 'views/sidebarView.js';
import NewAnnotationView from 'views/newAnnotationView.js';
import config from '../config';

var AppView = Backbone.View.extend({
  el: 'div#video-annotation',

  events: {
    'click span.caret': 'showSidebar',
    'click a.create': 'createByClick',
    'click a.cancel': 'cancel',
  },

  initialize: function () {

    this.dropbox();
    this.registerStorageChange();
    this.bindEvents();

    _.bindAll(this, 'render');
    _.bindAll(this, 'updateFrame');

    this.clear();
  },

  render: function (options) {
    this.getVideoKey();

    if (options.videoKey && this.videoKey === options.videoKey) {
      return;
    }

    options.videoKey = this.videoKey;

    // jscs: disable
    this.videoFrame = new Frame({ start_seconds: 0 });
    // jscs: enable

    this.storage = new AppStorage({ name: this.videoKey });
    this.UserInfo = new UserInfo({});

    this.fetchUser();
    this.updateVideoKey();
    this.syncData();

    this.videoFrame.on('change', this.updateFrame);
    this.videoTag = Utils.getVideoInterface();

    this.initializeView();
    this.$el.html($(this.sidebarView.render().el));
    this.$el.find('.sidebar').addClass('sidebar-hidden');
    this.updateFrame();
    this.highlight();
  },

  initializeView: function () {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.switch) {
        this.switchExtensionVisibility();
        sendResponse({});
      }
    });

    this.newAnnotationView = new NewAnnotationView({
      videoTag: this.videoTag,
    });

    this.newAnnotationView.videoFrame = this.videoFrame;

    this.sidebarView = new SidebarView({
      collection: Annotations,
      storage: this.storage,
      videoTag: this.videoTag,
      userInfo: this.UserInfo,
      dropboxFile: this.dropboxFile,
      arrowTag: '#video-annotation span.caret',
    });
  },

  fetch: function () {
    var self = this;
    self.dropboxFile.read(function (error, annotations) {
      if (!error) {
        Annotations.reset(annotations);
        self.storage.save(Annotations);
      } else {
        self.storage.get(function (annotations) {
          if (annotations) {
            Annotations.reset(annotations);
          } else {
            // if no data present, update collection sliently.
            Annotations.reset([], { silent: true });
            self.sidebarView.render();
          }
        });
      }

      self.updateFrame();
    });
  },

  bindEvents: function () {
    var self = this;
    $(document).bind('keydown', 'alt+s', function (e) {
      e.stopPropagation();
      self.changeframe();
      return false;
    });

    $(document).bind('keydown', 'alt+e', function (e) {
      e.stopPropagation();
      self.createAnnotation();
      return false;
    });

    $(document).bind('keydown', 'alt+d', function (e) {
      e.stopPropagation();
      self.quickAnnotation();
      return false;
    });

    $(document).bind('keydown', 'esc', function (e) {
      // TODO: remove stop propogation here
      e.stopPropagation();
      self.closeAnnotation(e);
      return false;
    });
  },

  clear: function () {
    this.$el.html('');
  },

  createAnnotation: function () {
    this.videoTag.pause();
    this.$el.append(this.newAnnotationView.render().el);
    this.expandAnnotationMarker();
    this.focusText();
  },

  changeframe: function () {
    this.renderAnnotationMarker();

    // jscs: disable
    this.newAnnotationView.start_seconds = parseInt(this.videoTag.getCurrentTime());
    this.videoFrame.set('start_seconds', this.newAnnotationView.start_seconds);
    // jscs: enable
  },

  quickAnnotation: function () {
    this.videoTag.pause();
    this.newAnnotationView.thatSeconds = true;
    this.$el.append(this.newAnnotationView.render().el);
    this.focusText();
  },

  focusText: function () {
    this.$el.find('.annotation-text').focus();
  },

  closeAnnotation: function (e) {
    this.newAnnotationView.cancel(e);
    this.removeAnnotationMarker();
    this.videoTag.play();
  },

  createByClick: function (e) {
    this.newAnnotationView.createByClick(e);
    this.removeAnnotationMarker();
    return false;
  },

  cancel: function (e) {
    this.newAnnotationView.cancel(e);
    this.removeAnnotationMarker();
    return false;
  },

  renderAnnotationMarker: function () {

    var getStartTime = () => {
      var totalSeconds = this.videoTag.getCurrentTime();
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = Math.floor(totalSeconds % 60);
      return { minutes: minutes, seconds: seconds };
    };

    if (_.isEmpty(this.$el.find('.annotation-marker'))) {
      // jscs: disable
      this.$el.append(Mustache.to_html($('#annotation-marker-template').html(), getStartTime()));
      // jscs: enable
    }

    var videoTag  = this.videoTag;
    var marker = this.$el.find('.annotation-marker');
    function onEnter() {
      $('.annotation-marker').css('opacity', '100');
    }

    function onLeave() {
      $('.annotation-marker').css('opacity', '0');
    }

    marker.hover(onEnter, onLeave);

    marker.css({ opacity: '100', bottom: videoTag.getControlsHeight() + 'px',
      left: videoTag.getSeekerPosition() + 'px' });
    marker.fadeTo(2000, 0);
  },

  expandAnnotationMarker: function () {
    var durationMarker = this.$el.find('.duration-marker');
    var annotationDuration = this.videoTag.getCurrentTime() - this.videoFrame.get('start_seconds');
    var width = annotationDuration * this.videoTag.getPixelsPerSecond();
    durationMarker.css({ width: width + 'px', display: 'block' });
    this.$el.find('.annotation-marker').unbind();
    this.$el.find('.annotation-marker').css('opacity', '100');
  },

  removeAnnotationMarker: function () {
    this.$el.find('.annotation-marker').remove();
  },

  showSidebar: function () {
    var sidebar = this.$el.find('.sidebar');
    if (sidebar.hasClass('sidebar-hidden')) {
      sidebar.removeClass('sidebar-hidden').addClass('sidebar-visible');
      this.$el.find('.caret').removeClass('fa-caret-left').addClass('fa-caret-right');
    } else {
      sidebar.removeClass('sidebar-visible').addClass('sidebar-hidden');
      this.$el.find('.caret').removeClass('fa-caret-right').addClass('fa-caret-left');
    }
  },

  getVideoKey: function () {
    var currentUrl = window.location;
    this.hostname = Utils.hosts[currentUrl.hostname] || '';
    this.videoKey = this.base64Url(currentUrl.href);
  },

  base64Url: function (currentUrl) {
    return btoa(encodeURIComponent(currentUrl).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  },

  getVideoId: function (name, query) {
    if (name === 'youtube') {
      this.videoKey = name + '_' + query.v;
    }
  },

  updateFrame: function () {
    this.$el.find('span.start_frame')
        .html(Utils.minuteSeconds(this.videoFrame.get('start_seconds')));
  },

  dropbox: function () {
    var dropboxChrome = new Dropbox.Chrome({
      key: config.dropbox.key,
    });
    this.dropboxFile = new DropboxFile({
      dropboxObj: dropboxChrome,
      name: this.videoKey,
    });
  },

  syncData: function () {
    var self = this;
    self.storage.get(function (annotations) {
      if (!_.isEmpty(annotations)) {
        self.dropboxFile.write(annotations, function () {
          self.fetch();
        });
      } else {
        self.fetch();
      }
    });
  },

  updateVideoKey: function () {
    this.storage.name = this.videoKey;
    this.dropboxFile.name = this.videoKey;

    //refresh object
    Annotations.storage = this.storage;
    Annotations.dropboxFile = this.dropboxFile;
  },

  fetchUser: function () {
    var self = this;
    var userStorage = new AppStorage({ name: Utils.userInfo });
    userStorage.get(function (userInfo) {
      if (_.isEmpty(userInfo)) {
        self.UserInfo.clear();
      } else {
        self.UserInfo.set(userInfo);
      }
    });
  },

  highlight: function () {
    var self = this;

    setInterval(function () {
        self.sidebarView.highlight();
      }, 1000);

  },

  registerStorageChange: function () { //when changes happen in storage, this get trigger
    var self = this;
    chrome.storage.onChanged.addListener(function (changes) {
      for (var key in changes) {
        if (key === Utils.UserInfo) {
          self.fetchUser();
        }
      }
    });
  },

  switchExtensionVisibility: function () {
    var $extension = $('#video-annotation');
    if ($extension.css('display') === 'none') {
      $extension.css('display', 'block');
    } else {
      $extension.css('display', 'none');
    }
  }
});

export default AppView;
