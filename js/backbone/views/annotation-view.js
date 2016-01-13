var video_app = video_app || {};
(function() {
	video_app.annotationView = Backbone.View.extend({
		tagName: 'li',
		className: 'video-annotation',
		events: {
			'click a.delete': 'delete',
			'click a.edit': 'edit',
			'click a.update': 'update',
			'click a.cancel-update': 'cancelUpdate',
			'click span.icon-title': 'changeIcon'
		},

		initialize: function(){
			_.bindAll(this, 'render');
			this.model.on('change', this.render);
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

		renderEdit: function(annotation){
			this.$el.find('.edit-annotation').html(
				Mustache.to_html($('#annotation-edit-template').html(), {annotation: annotation})
			);
		},

		secondsToMinutes: function(name, field){
			time = this.model.get(field);
			r = Utils.minuteSeconds(time);
			this.model.set(name, r);
		},

		update: function(e){
			e.preventDefault();
			var annotation = $(e.target).parent().siblings('textarea')[0].value;
			this.model.set(Utils.splitAnnotation(annotation));
			video_app.Annotations.add([this.model], {merge: true, silent: true});
			video_app.Annotations.saveDropbox();
		},

		delete: function(e){
			e.preventDefault();
			var curre_model = video_app.Annotations.findWhere(this.model);
			if (curre_model) {
				this.$el.remove();
				video_app.Annotations.remove(curre_model);
			}
		},

		edit: function(e){
			e.preventDefault();
			this.$el.find('.annotation-detail').hide();
			this.$el.find('.edit-annotation').show();
			this.renderEdit(this.model.get('annotation'));
			this.$el.find('.edit-annotation .edit-annotation-text').focus();
		},

		cancelUpdate: function(e){
			e.preventDefault();
			this.$el.find('.edit-annotation').hide();
			this.$el.find('.annotation-detail').show();
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