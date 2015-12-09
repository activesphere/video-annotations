var video_app = video_app || {};
(function() {
	var Annotations = Backbone.Collection.extend({
		model: video_app.Annotation,
	});

	video_app.Annotations = new Annotations();
})();