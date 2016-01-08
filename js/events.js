var video_app = video_app || {};
(function() {
	var EventPageController, dropboxChrome, hasProp = {}.hasOwnProperty;

	EventPageController = (function() {
		function EventPageController(dropboxChrome1) {
			this.dropboxChrome = dropboxChrome1;
			chrome.browserAction.onClicked.addListener((function(_this) {
				return function() {
					return _this.onBrowserAction();
				}
			})(this));
      this.dropboxChrome.onClient.addListener((function(_this) {
        return function(client) {
          client.onAuthStepChange.addListener(function() {
            return _this.onDropboxAuthChange(client);
          });
          return client.onError.addListener(function(error) {
            return _this.onDropboxError(client, error);
          });
        };
      })(this));
		}

		EventPageController.prototype.signIn = function(callback) {
			return this.dropboxChrome.client(function(client) {
				return client.authenticate(function(error) {
					if (error) {
						client.reset();
					}
					return callback();
				});
			});
		};

		EventPageController.prototype.signOut = function(callback) {
			return this.dropboxChrome.signOut(function() {
				return callback();
			});
		};

		EventPageController.prototype.onBrowserAction = function() {
			return this.dropboxChrome.client((function(_this) {
				return function(client) {
					var credentials;
					if (client.isAuthenticated()) {
						_this.dropboxChrome.userInfo();
						chrome.tabs.create({
							url: 'html/popup.html',
							active: true,
							pinned: false
						});
					}
					credentials = client.credentials();
					if (credentials.authState) {
						client.reset();
					}
					return _this.signIn(function() {
						return null;
					});
				};
			})(this));
		};

    EventPageController.prototype.onDropboxAuthChange = function(client) {
      var credentials;
      var _this = this;
      if (client.isAuthenticated()) {
      	debugger;
        chrome.browserAction.setPopup({
          popup: 'html/popup.html'
        });
        chrome.browserAction.setTitle({
          title: "Signed in"
        });
        chrome.browserAction.setBadgeText({
          text: ''
        });
        _this.dropboxChrome.userInfo();
      } else {
        chrome.browserAction.setPopup({
          popup: ''
        });
        credentials = client.credentials();
        if (credentials.authState) {
          chrome.browserAction.setTitle({
            title: 'Signing in...'
          });
          chrome.browserAction.setBadgeText({
            text: '...'
          });
          chrome.browserAction.setBadgeBackgroundColor({
            color: '#DFBF20'
          });
        } else {
          chrome.browserAction.setTitle({
            title: 'Click to sign into Dropbox'
          });
          chrome.browserAction.setBadgeText({
            text: '?'
          });
          chrome.browserAction.setBadgeBackgroundColor({
            color: '#DF2020'
          });
        }
      }
      return chrome.extension.sendMessage({
        notice: 'dropbox_auth'
      });
    };

    EventPageController.prototype.onDropboxError = function(client, error) {
      return this.errorNotice("Something went wrong while talking to Dropbox: " + error);
    };


		return EventPageController;
	})();

	dropboxChrome = new Dropbox.Chrome({
		key: 'zhu541eif1aph15'
	});

	window.controller = new EventPageController(dropboxChrome);
}).call(this);
