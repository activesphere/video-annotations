var video_app = video_app || {};
(function() {
	video_app.annotationView = Backbone.View.extend({
		tagName: 'li',
		events: {
			'click a.delete': 'delete'
		},

		initialize: function(){
		},

		render: function(){
			this.secondsToMinutes('start_minutes', 'start_seconds');
			this.secondsToMinutes('end_minutes', 'end_seconds');
			$(this.el)
			.html(Mustache.to_html($('#annotation-template').html(), this.model.toJSON()));
			return this;
		},

		secondsToMinutes: function(name, field){
			time = this.model.get(field);
			r = Utils.minuteSeconds(time);
			this.model.set(name, r);
		},

		delete: function(e){
			var curre_model = video_app.Annotations.findWhere(this.model);
			video_app.Annotations.remove(curre_model);
		}
	});
})();