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

import AnnotationMarker from './_appView/annotationMarker.js';

var AppView = Backbone.View.extend({
  el: 'div#video-annotation',

  events: {
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

    this.updateStorage();

    this.videoFrame.on('change', this.updateFrame);
    this.videoTag = Utils.getVideoInterface();

    this.initializeView();
    this.$el.html($(this.sidebarView.render().el));
    this.$el.find('.sidebar').addClass('sidebar-hidden');
    this.updateFrame();
  },

  initializeView: function () {
    this.newAnnotationView = new NewAnnotationView({
      videoTag: this.videoTag,
      videoFrame: this.videoFrame
    });

    Annotations.reset(null, { silent: true });
    this.sidebarView = new SidebarView({
      collection: Annotations,
      storage: this.storage,
      videoTag: this.videoTag,
      userInfo: this.UserInfo,
      dropboxFile: this.dropboxFile,
      arrowTag: '#video-annotation span.caret',
    });

    this.marker = new AnnotationMarker(this.newAnnotationView);
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

  bindResize: function () {
    $(window).bind('resize', () => {
      if ($('#video-annotation').find('.annotation-marker')[0]) {
        this.marker.removeAnnotationMarker();
        this.marker.renderStartMarker(true);
        this.marker.renderEndMarker();
      }
    });
  },

  clear: function () {
    this.$el.html('');
  },

  createAnnotation: function () {
    this.videoTag.pause();
    this.$el.append(this.newAnnotationView.render().el);
    this.marker.renderEndMarker();
    this.createEditor();
  },

  changeframe: function () {

    // jscs: disable
    this.newAnnotationView.start_seconds = parseInt(this.videoTag.getCurrentTime());
    this.videoFrame.set('start_seconds', this.newAnnotationView.start_seconds);
    this.marker.renderStartMarker();
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
    this.marker.removeAnnotationMarker();
    this.videoTag.play();
  },

  createByClick: function () {
    var value = this.editor ? this.editor.value() : '';
    this.newAnnotationView.createAnnotation(value);
    this.marker.removeAnnotationMarker();
    return false;
  },

  cancel: function (e) {
    this.newAnnotationView.cancel(e);
    this.marker.removeAnnotationMarker();
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

  updateStorage: function () {
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
    chrome.storage.onChanged.addListener(changes => {
      if (changes['video-annotation']) {
        this.switchExtensionVisibility(changes['video-annotation'].newValue);
      }
    });
  },

  switchExtensionVisibility: function (data) {
    var $extension = $('#video-annotation');
    if (data) {
      $extension.css('display', 'block');
    } else {
      $extension.css('display', 'none');
    }
  }
});

export default AppView;
