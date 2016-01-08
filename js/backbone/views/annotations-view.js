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
		userInfoTemplate: function () {
			return $('#user-main-template').html();
		},
		events: {
			'keyup input.search_annotations': 'search',
			'click a.close_annotations': 'closeAnntations'
		},

		initialize: function(options){
			_.bindAll(this, 'renderList');
			_.bindAll(this, 'syncAnnotations');
			_.bindAll(this, 'updateUserInfo');

			this.arrowTag = options.arrowTag;
			this.storage = options.storage;
			this.dropbox_file = options.dropbox_file;
			this.video_tag =  options.video_tag;
			this.userInfo = options.user_info;

			this.collection.on('reset', this.renderList);
			this.collection.on('add', this.renderList);
			this.collection.on('remove', this.renderList);

			this.collection.on('reset', this.syncAnnotations);
			this.collection.on('add', this.syncAnnotations);
			this.collection.on('remove', this.syncAnnotations);

			this.userInfo.on('change', this.updateUserInfo);

			this.close_url = chrome.extension.getURL('images/close.png');
		},

		render: function(){
			$(this.el).html(Mustache.to_html(this.template(), {close_url: this.close_url}));
			this.renderList();
			return this;
		},

		renderList: function(){
			this.$el.find('.search_annotations').val('');
			this.$el.find('ul.annotations').empty();
			this.addAll(this.collection.sort('start_seconds'));
		},

		addAll: function(models){
			var self = this;
			if (!_.isEmpty(models)){
				_.each(models, function (annotation) { self.addOne(annotation); });
			} else {
				this.$el.find('ul.annotations').html(Mustache.to_html(this.noAnnotationTemplate()
					, {close_url: this.close_url}));
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

		updateUserInfo: function(){
			console.log('User Info triggerd');
			var name = this.userInfo.get('display_name');
			var short_name = '';
			_.each(name.split(' '), function(name){ short_name = short_name + name.charAt(0)})
			this.$el.find('.user_info_detail')
				.html(Mustache.to_html(this.userInfoTemplate(), _.extend(
					this.userInfo.toJSON(),
					{short_name: short_name})
				));
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

						$($li).find('span.icon-title')
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