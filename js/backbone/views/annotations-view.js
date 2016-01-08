var video_app = video_app || {};
(function ($) {
	video_app.annotationsView = Backbone.View.extend({
		tagName:'div',
		className: 'left_side',
		template: function () {
			return $('#annotations-template').html();
		},
		noAnnotationTemplate: function () {
			return $('#no-annotation-template').html();
		},
		events: {
			'keyup input.search_annotations': 'search',
			'click a.close_annotations': 'closeAnntations'
		},

		initialize: function(options){
			_.bindAll(this, 'render');
			_.bindAll(this, 'syncAnnotations');

			this.arrowTag = options.arrowTag;
			this.storage = options.storage;
			this.dropbox_file = options.dropbox_file;
			this.video_tag =  options.video_tag;

			this.collection.on('reset', this.render);
			this.collection.on('add', this.render);
			this.collection.on('remove', this.render);

			this.collection.on('reset', this.syncAnnotations);
			this.collection.on('add', this.syncAnnotations);
			this.collection.on('remove', this.syncAnnotations);
		},

		render: function(){
			close_url = chrome.extension.getURL('images/close.png');
			$(this.el).html(Mustache.to_html(this.template(), {close_url: close_url}));
			this.addAll(this.collection.sort('start_seconds'));
			return this;
		},

		addAll: function(models){
			var self = this;
			if (!_.isEmpty(models)){
				_.each(models, function (annotation) { self.addOne(annotation); });
			} else {
				this.$el.find('ul.annotations').html(this.noAnnotationTemplate());
			}
		},

		addOne: function(annotation){
			var view = new video_app.annotationView({model: annotation});
			this.$el.find('ul.annotations').append(view.render().el);
		},

		search: function(e){
			var keyword = $(e.target).val();
			search_result = this.collection.search(keyword);
			this.$el.find('ul.annotations').empty();
			this.addAll(search_result);
		},

		closeAnntations: function(event){
			event.preventDefault();
			this.$el.toggle( "slide" );
			$(this.arrowTag).fadeIn('slow');
		},

		syncAnnotations: function(){
			this.storage.save(this.collection);
			json_data = _.map(this.collection.models, function(model){ return model.toJSON() });
			this.dropbox_file.write(json_data);
		},

		highlight: function(){
			var self = this;
			if ( !self.video_tag.paused  && !_.isEmpty(self.collection.models) ) {
				var current_seconds = parseInt(self.video_tag.currentTime);
				_.each($(self.$el).find('li'), function($li){
					//Check if type auto and window opened
					if( ($($li).find('span.icon-title').hasClass('icono-caretDownCircle')
						&& $($li).find('span.icon-title').data('type') == 'auto'
						&& $($li).find('div.annotation-description').css('display') == 'block') ) {

						$($li).find('span.icon-title');
							.removeClass('icono-caretDownCircle')
							.addClass('icono-caretRightCircle');
						$($li).find('.annotation-description').hide();
					}
				});

				_.each(self.collection.models, function(model){
					if ( (model.get('end_seconds') != null
						&& current_seconds >= model.get('start_seconds')
						&& current_seconds <= model.get('end_seconds'))
						|| model.get('start_seconds') == current_seconds ) {
						self.$el.find('li.' + model.get('id') + ' .icon-title')
							.removeClass('icono-caretRightCircle')
							.addClass('icono-caretDownCircle');
						self.$el.find('li.' + model.get('id') + ' .annotation-description').show();
					}
				});
			}
		}
	});
})(jQuery);