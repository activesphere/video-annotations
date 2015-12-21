var video_app = video_app || {};
(function ($) {
	video_app.annotationsView = Backbone.View.extend({
		tagName:'div',
		className: 'left_side',
		events: {
			'keyup input.search_annotations': 'search',
			'click a.close_annotations': 'closeAnntations'
		},

		initialize: function(options){
			_.bindAll(this, 'render');
			_.bindAll(this, 'updateFrame');

			this.arrowTag = options.arrowTag;
			this.video_frame = options.video_frame;

			this.collection.on('reset', this.render);
			this.collection.on('add', this.render);
			this.video_frame.on('change', this.updateFrame);
		},

		render: function(){
			$(this.el).html(Mustache.to_html($('#annotations-template').html()));
			this.addAll(this.collection.sort('start_seconds'));
			return this;
		},

		addAll: function(models){
			var self = this;
			if (!_.isEmpty(models)){
				_.each(models, function (annotation) { self.addOne(annotation); });
			} else {
				this.$el.find('ul.annotations').html($('#no-annotation-template').html());
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
			this.$el.toggle( "slide" );
			$(this.arrowTag).fadeIn('slow');
		},

		updateFrame: function(){
			this.$el.find('span.start_frame')
					.html(Utils.minuteSeconds(this.video_frame.get('start_seconds')));
		}
	});
})(jQuery);