import Utils from './utils.js';
import Dropbox from './vendor/dropbox.js';

/* global chrome */

const Chrome = function chrome(clientOptions) {
  this.clientOptions = clientOptions;
  this._userInfo = null;
  this.onClient = new Dropbox.Util.EventSource();
};

Chrome.prototype.client = function chromeClient(callback) {
  const client = new Dropbox.Client(this.clientOptions);
  client.authDriver(new Dropbox.AuthDriver.ChromeExtension({
    receiverPath: 'html/chrome_oauth_receiver.html',
  }));
  client.authenticate({ interactive: false }, () => {
    client.onAuthStepChange.addListener(() =>
      (this._userInfo = null));

    this.onClient.dispatch(client);
    return callback(client);
  });
};

Chrome.prototype.userInfo = function userInfoFn() {
  chrome.storage.local.get(Utils.userInfo, (items) => {
    const opt = {};
    if (items && items[Utils.userInfo]) {
      try {
        this._userInfo = Dropbox.AccountInfo.parse(items[Utils.userInfo]);
        return true;
      } catch (error) {
        // const parseError = error;
        this._userInfo = null;
      }
    }

    this.client((client) => {
      if (!client.isAuthenticated()) {
        this._userInfo = {};
        return false;
      }

      client.getUserInfo((error, userInfo) => {
        if (error) {
          this._userInfo = {};
          return false;
        }

        opt[Utils.userInfo] = userInfo.json();
        chrome.storage.local.set(opt, () => {
          this._userInfo = userInfo;
        });
        return undefined;
      });
      return undefined;
    });
    return undefined;
  });
};

Chrome.prototype.signOut = function signOutFn(callback) {
  return this.client((client) => {
    if (!client.isAuthenticated()) {
      return callback();
    }

    return client.signOut(() => {
      this._userInfo = null;
      return chrome.storage.local.remove(Utils.userInfo, () =>
        callback()
      );
    });
  });
};

Dropbox.Chrome = Chrome;

export default Dropbox;
