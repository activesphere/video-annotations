import Dropbox from './dropbox_chrome.js';

(function incept() {
  Dropbox.AuthDriver.ChromeExtension.oauthReceiver();
}).call(this);
