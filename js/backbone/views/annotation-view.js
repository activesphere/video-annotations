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
			this.secondsToMinutes('start_minutes', 'start_seconds');
			this.secondsToMinutes('end_minutes', 'end_seconds');
			$(this.el).html(Mustache.to_html($('#annotation-template').html(), this.model.toJSON()));
			return this;
		},

		secondsToMinutes: function(name, field){
			time = this.model.get(field);
			r = null;
			if(time){
				minutes = Math.floor(time / 60);
				seconds = time - minutes * 60;
				r = minutes + '.' + seconds;
			}
			this.model.set(name, r)
		},

		ignore: function(event) {
			event.stopPropagation();
		},
	});
})();