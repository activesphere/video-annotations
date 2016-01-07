var video_app = video_app || {};

(function($, _, video_app) {
	video_app.popup_view = Backbone.View.extend({
		el: 'div#popup',

		template: function () {
			return $('#user-template').html();
		},

		events: {
			'click a.signout': 'signOut',
			'click a.signin': 'signIn'
		},

		initialize: function(){
			_.bindAll(this, 'render');

			this.model.on('change', this.render);

			this.storage = new video_app.AppStorage({name: Utils.userInfo})
			this.fetch();
		},

		render: function(){
			console.log("Model JSON: ", this.model.toJSON());
			$(this.el)
			.html(Mustache.to_html(this.template(), this.model.toJSON()));
		},

		fetch: function(){
			var self = this;
			this.storage.get(function(user_info){
				console.log("Fetch", user_info);
				user_info === null ? self.model.clear() : self.model.set(user_info);
			});
		},

		signOut: function(event){
			event.preventDefault();
			var self = this;
			chrome.runtime.getBackgroundPage(function(eventPage) {
				return eventPage.controller.signOut((function(_this) {
					return function() {
						self.fetch();
						return null;
					};
				})(this));
			});
		},

		signIn: function(event){
			event.preventDefault();
			var self = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {
        return eventPage.controller.signIn((function(_this) {
          return function() {
          	self.fetch();
            return null;
          };
        })(this));
      });
      return false;
		}
	});

	$('body').prepend("<div id='popup'></div>");
	var userInfo = new video_app.userInfo({});
	popup_view = new video_app.popup_view({model: userInfo});
	popup_view.render();

})($, _, video_app);