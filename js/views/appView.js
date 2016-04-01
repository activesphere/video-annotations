import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';
import Dropbox from 'dropbox_chrome.js';
import SimpleMDE from 'vendor/simplemde.min.js';

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

    this.registerStorageChange();
    this.bindEvents();

    this.UserInfo = new UserInfo({});
    this.fetchUser();
    this.draggable = false;

    this.getVideoKey();
    this.storage = new AppStorage({ name: this.videoKey });
    this.dropbox();

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

    this.updateVideoKey();

    this.videoFrame.on('change', this.updateFrame);
    this.videoTag = Utils.getVideoInterface();

    this.initializeView();
    this.$el.html($(this.sidebarView.render().el));
    this.$el.find('.sidebar').addClass('sidebar-hidden');
    this.bindResizeEvents();
    this.bindDurationChange();
    this.updateFrame();
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

    Annotations.reset(null, { silent: true });
    this.sidebarView = new SidebarView({
      collection: Annotations,
      storage: this.storage,
      videoTag: this.videoTag,
      userInfo: this.UserInfo,
      dropboxFile: this.dropboxFile,
      arrowTag: '#video-annotation span.caret',
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

  bindResizeEvents: function () {
    this.$el.find('.resizer').on('mousedown', this.initDrag.bind(this));
    $(document).on('mousemove', this.doDrag.bind(this));
    $(document).on('mouseup', this.stopDrag.bind(this));
  },

  bindDurationChange: function () {
    $('video').on('timeupdate', this.sidebarView.highlight.bind(this.sidebarView));
  },

  initDrag: function (e) {
    this.xValue = e.clientX;
    this.startWidth = parseInt(this.$el.find('.sidebar').css('width'));
    this.draggable = true;
  },

  doDrag: function (e) {
    e.preventDefault();
    var width = this.startWidth - e.clientX + this.xValue;
    var sidebar = this.$el.find('.sidebar');

    if (this.draggable && width > 300) {
      sidebar.css('transition', '0s');

      sidebar.css('width',
        this.startWidth - e.clientX + this.xValue + 'px'
      );

      this.$el.find('.caret').css('right', width - 1 + 'px');
    }
  },

  stopDrag: function () {
    this.draggable = false;
    this.$el.find('.sidebar').css('transition', '.2s');
  },

  clear: function () {
    this.$el.html('');
  },

  createAnnotation: function () {
    this.videoTag.pause();
    this.$el.append(this.newAnnotationView.render().el);
    this.newAnnotationView.renderEndMarker();
    this.createEditor();
  },

  changeframe: function () {

    // jscs: disable
    this.newAnnotationView.start_seconds = parseInt(this.videoTag.getCurrentTime());
    this.videoFrame.set('start_seconds', this.newAnnotationView.start_seconds);
    this.newAnnotationView.renderStartMarker();
    // jscs: enable
  },

  quickAnnotation: function () {
    this.videoTag.pause();
    this.newAnnotationView.isQuickAnnotation = true;
    this.$el.append(this.newAnnotationView.render().el);
    this.createEditor();
  },

  closeAnnotation: function (e) {
    this.newAnnotationView.cancel(e);
    this.newAnnotationView.removeAnnotationMarker();
    this.videoTag.play();
  },

  createByClick: function () {
    var value = this.editor ? this.editor.value() : '';
    this.newAnnotationView.createAnnotation(value);
    this.newAnnotationView.removeAnnotationMarker();
    return false;
  },

  cancel: function (e) {
    this.newAnnotationView.cancel(e);
    this.newAnnotationView.removeAnnotationMarker();
    return false;
  },

  createEditor: function () {
    this.editor = new SimpleMDE({ element: document.getElementById('editor'),
      autofocus: true,
      placeholder: 'Enter your Annotation here..'
    });
    this.editor.codemirror.setOption('extraKeys', {
      Esc: () => {
        this.cancel();
      },

      'Alt-Enter': () => {
        this.createByClick();
      }
    });
  },

  showSidebar: function () {
    var sidebar = this.$el.find('.sidebar');
    if (sidebar.hasClass('sidebar-hidden')) {
      sidebar.removeClass('sidebar-hidden').addClass('sidebar-visible');
      sidebar.css('right', '0px');
      this.$el.find('.caret').removeClass('fa-caret-left').addClass('fa-caret-right');
    } else {
      var right = parseInt(sidebar.css('width')) + 1;
      sidebar.removeClass('sidebar-visible').addClass('sidebar-hidden');
      sidebar.css('right', -1 * right + 'px');
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
