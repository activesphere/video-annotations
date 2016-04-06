import Dropbox from 'dropbox_chrome.js';
import config from './config';

var EventPageController = {}.hasOwnProperty;
var dropboxChrome = {}.hasOwnProperty;

EventPageController = function (dropboxChrome) {
  this.dropboxChrome = dropboxChrome;
  chrome.browserAction.onClicked.addListener(() => {
    chrome.storage.local.get('video-annotation', (data) => {
      if (!data['video-annotation']) {
        chrome.storage.local.set({ 'video-annotation': true }, () => null);
        return;
      }

      chrome.storage.local.set({ 'video-annotation': false }, () => null);
    });
  });

  this.dropboxChrome.onClient.addListener(client => {
    client.onAuthStepChange.addListener(() => this.onDropboxAuthChange(client));

    return client.onError.addListener(error => this.onDropboxError(client, error));
  });

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

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'signIn') {
      return this.signInHandler();
    } else if (request.type === 'signOut') {
      return this.signOut(function () {
        sendResponse();
      });
    }
  });
};

EventPageController.prototype.signInHandler = function () {
    return this.dropboxChrome.client((client) => {
      var credentials;
      if (client.isAuthenticated()) {
        this.dropboxChrome.userInfo();
      }

      credentials = client.credentials();
      if (credentials.authState) {
        client.reset();
      }

      return this.signIn(() => null);
    });
  };

EventPageController.prototype.signIn = function (callback) {
  return this.dropboxChrome.client((client) =>
    client.authenticate((error) => {
      if (error) {
        client.reset();
      }

      return callback();
    }));
};

EventPageController.prototype.signOut = function (callback) {
  this.dropboxChrome.signOut(function () {
    callback();
  });
};

EventPageController.prototype.onDropboxAuthChange = function (client) {
  if (client.isAuthenticated()) {
    this.dropboxChrome.userInfo();
  }
};

EventPageController.prototype.onDropboxError = function (client, error) {
  this.errorNotice('Something went wrong while talking to Dropbox: ' + error);
};

dropboxChrome = new Dropbox.Chrome({
  key: config.dropbox.key
});

window.controller = new EventPageController(dropboxChrome);
