import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'lib/jquery.hotkeys.js';
import Dropbox from 'dropbox_chrome.js';

import Utils from 'utils.js';
import DropboxFile from 'dropbox-file.js';
import {Frame, UserInfo} from 'backbone/models.js';
import AppStorage from 'storage.js';
import Annotations from 'backbone/collections.js';
import SidebarHiddenView from 'backbone/views/sidebar-hidden-view.js';
import SidebarVisibleView from 'backbone/views/sidebar-visible-view.js';
import NewAnnotationView from 'backbone/views/new-annotation-view.js';
import config from '../../config';

var AppView = Backbone.View.extend({
  el: 'div#video-annotations',

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
    this.videoTag = $('video')[0];

    this.initializeView();
    this.bindEvents();
    this.highlight();
    this.clear();
    this.render();
  },

  render: function () {
    var _this = this;
    this.$el.html(this.sidebarHiddenView.render().el);
    this.$el.append($(this.sidebarVisibleView.render().el).hide());
    _this.updateFrame();
  },

  initializeView: function () {
    this.newAnnotationView = new NewAnnotationView({
      videoTag: this.videoTag,
    });

    this.newAnnotationView.videoFrame = this.videoFrame;

    this.sidebarHiddenView = new SidebarHiddenView();
    this.sidebarVisibleView = new SidebarVisibleView({
      collection: Annotations,
      storage: this.storage,
      videoTag: this.videoTag,
      userInfo: this.UserInfo,
      dropboxFile: this.dropboxFile,
      arrowTag: '#video-annotations span.left_arrow',
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
            self.sidebarVisibleView.render();
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
    });

    $(document).bind('keydown', 'alt+e', function (e) {
      e.stopPropagation();
      self.createAnnotation();
      return false;
    });

    $(document).bind('keydown', 'alt+d', function (e) {
      e.stopPropagation();
      self.quickAnnotation();
    });

    $(document).bind('keydown', 'alt+w', function (e) {
      e.stopPropagation();
      self.closeAnnotation(e);
    });

    $(document).bind('keydown', 'esc', function (e) {
      e.stopPropagation();
      self.closeAnnotation(e);
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

  changeframe: function (e) {
    if (this.newAnnotationView && this.videoTag) {

      // jscs: disable
      this.newAnnotationView.start_seconds = parseInt(this.videoTag.currentTime);
      this.videoFrame.set('start_seconds', this.newAnnotationView.start_seconds);
      // jscs: enable
    }
  },

  quickAnnotation: function (e) {
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

  showSidebar: _.debounce(function (e) {
    $(e.target).fadeOut();
    this.$el.find('.left_side').toggle('slide');
  }, 20),

  getVideoKey: function () {
    var currentUrl = window.location;

    // query={};
    // currentUrl.search.split('?')[1].split('&')
    //   .forEach(function(i){
    //     query[i.split('=')[0]]=i.split('=')[1];
    //   });

    this.hostname = Utils.hosts[currentUrl.hostname] || '';
    this.videoKey = this.base64Url(currentUrl.href);

    // this.getVideoId(name, query);
  },

  base64Url: function (currentUrl) {
    return btoa(encodeURIComponent(currentUrl).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  },

  getVideoId: function (name, query) {
    if (name == 'youtube') {
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
    var userStorage = new AppStorage({ name: Utils.UserInfo });
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

    // $(this.videoTag).on("loadeddata", function(e){
    console.log('Loaded Video');
    setInterval(function () {
        self.sidebarVisibleView.highlight();
      }, 1000);

    // });
  },

  registerStorageChange: function () { //when changes happen in storage, this get trigger
    var self = this;
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      for (var key in changes) {
        var storageChange = changes[key];
        if (key === Utils.UserInfo) {
          self.fetchUser();
        }
      }
    });
  },
});

export default AppView;
