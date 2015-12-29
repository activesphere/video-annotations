var video_app = video_app || {};
(function() {
	video_app.annotationView = Backbone.View.extend({
		tagName: 'li',
		events: {
			'click a.delete': 'delete',
			'click a.edit': 'edit'
		},

		initialize: function(){
		},

		render: function(){
			url = chrome.extension.getURL('images/edit.png');
			this.secondsToMinutes('start_minutes', 'start_seconds');
			this.secondsToMinutes('end_minutes', 'end_seconds');
			$(this.el)
			.html(Mustache.to_html($('#annotation-template').html(), _.extend(this.model.toJSON(), {img_url: url})));
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