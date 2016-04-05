// TODO: Find a better name for this file
import Dropbox from 'dropbox_chrome.js';
import config from './config';

var EventPageController = {}.hasOwnProperty;
var dropboxChrome = {}.hasOwnProperty;

EventPageController = (function () {
  function EventPageController(dropboxChrome) {
    this.dropboxChrome = dropboxChrome;
    chrome.browserAction.onClicked.addListener(() => {
      chrome.storage.local.get('video-annotation', function  (data) {
        if (!data['video-annotation']) {
          chrome.storage.local.set({ 'video-annotation': true }, function () {
          });

          return;
        }

        chrome.storage.local.set({ 'video-annotation': false }, function () {
        });
      });
    });

    this.dropboxChrome.onClient.addListener((function (_this) {
      return function (client) {
        client.onAuthStepChange.addListener(function () {
          return _this.onDropboxAuthChange(client);
        });

        return client.onError.addListener(function (error) {
          return _this.onDropboxError(client, error);
        });
      };
    })(this));

    chrome.storage.onChanged.addListener(data => {
      const changeIcon = enabled => {
        if (enabled) {
          chrome.browserAction.setIcon({ path: 'images/icon.png' });
          return;
        }

        chrome.browserAction.setIcon({ path: 'images/icon-disabled.png' });
      };

      if (data['video-annotation']) {
        changeIcon(data['video-annotation'].newValue);
      }
    });

    var _this = this;
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === 'signIn') {
        return _this.signInHandler();
      } else if (request.type === 'signOut') {
        return _this.signOut(function () {
          sendResponse();
        });
      }
    });
  }

  EventPageController.prototype.signInHandler = function () {
    return this.dropboxChrome.client((function (_this) {
      return function (client) {
        var credentials;
        if (client.isAuthenticated()) {
          _this.dropboxChrome.userInfo();
        }

        credentials = client.credentials();
        if (credentials.authState) {
          client.reset();
        }

        return _this.signIn(function () {
          return null;
        });
      };
    })(this));
  };

  EventPageController.prototype.signIn = function (callback) {
    return this.dropboxChrome.client(function (client) {
      return client.authenticate(function (error) {
        if (error) {
          client.reset();
        }

        return callback();
      });
    });
  };

  EventPageController.prototype.signOut = function (callback) {
    return this.dropboxChrome.signOut(function () {
      return callback();
    });
  };

  EventPageController.prototype.onDropboxAuthChange = function (client) {
    if (client.isAuthenticated()) {
      this.dropboxChrome.userInfo();
    }
  };

  EventPageController.prototype.onDropboxError = function (client, error) {
    return this.errorNotice('Something went wrong while talking to Dropbox: ' + error);
  };

  return EventPageController;
})();

dropboxChrome = new Dropbox.Chrome({
  key: config.dropbox.key
});

window.controller = new EventPageController(dropboxChrome);
