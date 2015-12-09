var video_app = video_app || {};
(function() {
	video_app.annotationView = Backbone.View.extend({
		tagName: 'li',
		events: {
			'click a': 'ignore'
		},

		initialize: function(){
		},

		render: function(){
			console.log('Annotation');
			$(this.el).html(Mustache.to_html($('#annotation-template').html(), this.model.toJSON()));
			return this;
		},

		ignore: function(event) {
			event.stopPropagation();
		},
	});
})();