import Dropbox from './dropbox_chrome.js';
import config from './config';

/* global chrome */

let EventPageController = {}.hasOwnProperty;
let dropboxChrome = {}.hasOwnProperty;

EventPageController = function eventPageController(rDropboxChrome) {
  this.dropboxChrome = rDropboxChrome;
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
      return this.signOut(() => {
        sendResponse();
      });
    }
    // should never get here.
    return false;
  });
};

EventPageController.prototype.signInHandler = function signInHandler() {
  return this.dropboxChrome.client((client) => {
    if (client.isAuthenticated()) {
      this.dropboxChrome.userInfo();
    }

    const credentials = client.credentials();
    if (credentials.authState) {
      client.reset();
    }

    return this.signIn(() => null);
  });
};

EventPageController.prototype.signIn = function signIn(callback) {
  return this.dropboxChrome.client((client) =>
    client.authenticate((error) => {
      if (error) {
        client.reset();
      }

      return callback();
    }));
};

EventPageController.prototype.signOut = function signOut(callback) {
  this.dropboxChrome.signOut(() => {
    callback();
  });
};

EventPageController.prototype.onDropboxAuthChange = function dbAuthChange(client) {
  if (client.isAuthenticated()) {
    this.dropboxChrome.userInfo();
  }
};

EventPageController.prototype.onDropboxError = function dbError(client, error) {
  this.errorNotice(
    `Something went wrong while talking to Dropbox: ${error}`
  );
};

dropboxChrome = new Dropbox.Chrome({
  key: config.dropbox.key,
});

window.controller = new EventPageController(dropboxChrome);
