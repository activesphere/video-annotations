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

		return EventPageController;
	})();

	dropboxChrome = new Dropbox.Chrome({
		key: 'zhu541eif1aph15'
	});

	window.controller = new EventPageController(dropboxChrome);
}).call(this);
