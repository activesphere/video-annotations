var video_app = video_app || {};
(function() {
	video_app.annotationView = Backbone.View.extend({
		tagName: 'li',
		className: 'video-annotation',
		events: {
			'click a.delete': 'delete',
			'click a.edit': 'edit',
			'click span.icon-title': 'changeIcon'
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
			$(this.el).addClass(this.model.get('id') + '');
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
		},

		changeIcon: function(e){
			if( $(e.target).hasClass('icono-caretRightCircle') ) {
				//Set type to manual to aviod window close automatally when video playing
				$(e.target).data('type', 'manual');
				$(e.target).removeClass('icono-caretRightCircle').addClass('icono-caretDownCircle');
				this.$el.find('.annotation-description').show();
			} else {
				$(e.target).data('type', 'auto');
				$(e.target).removeClass('icono-caretDownCircle').addClass('icono-caretRightCircle');
				this.$el.find('.annotation-description').hide();
			}
		}
	});
})();