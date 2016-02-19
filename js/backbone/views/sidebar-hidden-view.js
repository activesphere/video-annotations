var video_app = video_app || {};
(function() {
video_app.SidebarHiddenView = Backbone.View.extend({
	render: function () {
		this.$el.html(Mustache.to_html($("#sidebar-hidden-template").html()));
		return this;
	},
});
})();