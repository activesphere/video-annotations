import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';
import Dropbox from 'dropbox_chrome.js';

import Utils from 'utils.js';
import DropboxFile from 'dropboxUtils.js';
import {Frame, UserInfo} from 'models/models.js';
import AppStorage from 'localStorageUtils.js';
import Annotations from 'collections/collections.js';
import SidebarView from 'views/sidebarView.js';
import NewAnnotationView from 'views/newAnnotationView.js';
import config from '../config';

var AppView = Backbone.View.extend({
  el: 'div#videoAnnotations',

  events: {
    'click span.left_arrow': 'showSidebar',
  },

  initialize: function (options) {
    var appState = options;
    this.getVideoKey();
    if (appState.view && appState.view.videoKey === this.videoKey) {
      return;
    }

    appState.view = this;
    this.dropbox();
    this.registerStorageChange();

    _.bindAll(this, 'render');
    _.bindAll(this, 'updateFrame');

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
    this.bindEvents();
    this.highlight();
    this.clear();
    this.render();
  },

  render: function () {
    var _this = this;
    this.$el.html($(this.sidebarView.render().el));
    this.$el.find('.left_side').addClass('sidebar-hidden');
    _this.updateFrame();
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
      arrowTag: '#videoAnnotations span.left_arrow',
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

    $(document).bind('keydown', 'alt+w', function (e) {
      e.stopPropagation();
      self.closeAnnotation(e);
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

  createAnnotation: _.debounce(function () {
    this.videoTag.pause();
    this.$el.append(this.newAnnotationView.render().el);
    this.focusText();
  }, 20),

  changeframe: function () {
    if (this.newAnnotationView && this.videoTag) {

      // jscs: disable
      this.newAnnotationView.start_seconds = parseInt(this.videoTag.getCurrentTime());
      this.videoFrame.set('start_seconds', this.newAnnotationView.start_seconds);
      // jscs: enable
    }
  },

  quickAnnotation: function () {
    if (this.newAnnotationView && this.videoTag) {
      this.videoTag.pause();
      this.newAnnotationView.thatSeconds = true;
      this.$el.append(this.newAnnotationView.render().el);
      this.focusText();
    }
  },

  focusText: function () {
    this.$el.find('.annotation_text').focus();
  },

  closeAnnotation: function (e) {
    this.newAnnotationView.cancel(e);
    this.videoTag.play();
  },

  showSidebar: _.debounce(function () {
    var sidebar = this.$el.find('.left_side');
    if (sidebar.hasClass('sidebar-hidden')) {
      sidebar.removeClass('sidebar-hidden').addClass('sidebar-visible');
      this.$el.find('.left_arrow').removeClass('fa-caret-left').addClass('fa-caret-right');
    } else {
      sidebar.removeClass('sidebar-visible').addClass('sidebar-hidden');
      this.$el.find('.left_arrow').removeClass('fa-caret-right').addClass('fa-caret-left');
    }
  }, 20),

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
    var $extension = $('#videoAnnotations');
    if ($extension.css('display') === 'none') {
      $extension.css('display', 'block');
    } else {
      $extension.css('display', 'none');
    }
  }
});

export default AppView;
