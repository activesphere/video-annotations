import Backbone from 'backbone';
import Mustache from 'mustache.js';
import $ from 'lib/jquery.hotkeys.js';
import _ from 'lodash';

import Utils from 'utils.js';
import UserInfo from 'backbone/models.js';
import AppStorage from 'storage.js';

var PopupView = Backbone.View.extend({
  el: 'div#popup',

  template: function () {
    return $('#user-template').html();
  },

  events: {
    'click a.signout': 'signOut',
    'click a.signin': 'signIn',
  },

  initialize: function () {
    _.bindAll(this, 'render');

    this.model.on('change', this.render);

    this.storage = new AppStorage({ name: Utils.userInfo });
    this.fetch();
  },

  render: function () {
    console.log('Model JSON: ', this.model.toJSON());

    // jscs: disable
    $(this.el).html(Mustache.to_html(this.template(), this.model.toJSON()));
    // jscs: enable
  },

  fetch: function () {
    var self = this;
    this.storage.get(function (userInfo) {
      console.log('Fetch', userInfo);
      if (userInfo === null) {
        self.model.clear();
      } else {
        self.model.set(userInfo);
      }
    });
  },

  signOut: function (event) {
    event.preventDefault();
    var self = this;
    chrome.runtime.getBackgroundPage(function (eventPage) {
      return eventPage.controller.signOut(function () {
        self.fetch();
        return null;
      });
    });
  },

  signIn: function (event) {
    event.preventDefault();
    var self = this;
    chrome.runtime.getBackgroundPage(function (eventPage) {
      return eventPage.controller.signIn((function (_this) {
        return function () {
          self.fetch();
          return null;
        };
      })(this));
    });

    return false;
  },
});

$('body').prepend("<div id='popup'></div>");

var popupView = new PopupView({ model: new UserInfo({}) });
popupView.render();
