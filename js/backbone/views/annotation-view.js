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
			edit_url = chrome.extension.getURL('images/edit.png');
			delete_url = chrome.extension.getURL('images/delete.png');
			this.secondsToMinutes('start_minutes', 'start_seconds');
			this.secondsToMinutes('end_minutes', 'end_seconds');
			$(this.el)
			.html(Mustache.to_html($('#annotation-template').html(), _.extend(
				this.model.toJSON(),
				{edit_url: edit_url},
				{delete_url: delete_url})
			));
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