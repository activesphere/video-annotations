var video_app = video_app || {};
(function ($) {
	video_app.annotationsView = Backbone.View.extend({
		el: 'div#annotations_list',
		events: {
			'click input.search_annotations': 'ignore',
			'keyup input.search_annotations': 'search',
			'keydown .search_annotations': 'ignore',
			'click a.close_annotations': 'closeAnntations'
		},

		initialize: function(){
			_.bindAll(this, 'render');
			this.collection.on('reset', this.render);
			this.collection.on('add', this.render);
		},

		render: function(){
			this.$el.empty();
			if(!_.isEmpty(this.collection.models)){
				$(this.el).html(Mustache.to_html($('#annotations-template').html()));
				this.addAll(this.collection.sort('start_seconds'));
			} else {
				$(this.el).html("<a href='#' class='close_annotations'>x</a><h3 class='center mt5'>No Annotations</h3>")
			}
		},

		addAll: function(models){
			var self = this;
			if(!_.isEmpty(models)){
				_.each(models, function (annotation) { self.addOne(annotation); });
			} else {
				this.$el.find('ul.annotations').html("<a href='#' class='close_annotations'>x</a><h3 class='center mt5'>No Annotations</h3>")
			}
		},

		addOne: function(annotation){
			var view = new video_app.annotationView({model: annotation});
			this.$el.find('ul.annotations').append(view.render().el);
		},

		search: function(e){
			this.ignore(e);
			var keyword = $(e.target).val();
			search_result = this.collection.search(keyword);
			this.$el.find('ul.annotations').empty();
			this.addAll(search_result);
		},

		ignore: function(event) {
			event.stopPropagation();
		},

		closeAnntations: function(event){
			$('#video-annotations .left_alignment').toggle( "slide" );
			$('#video-annotations span.left_arrow').fadeIn('slow');
		}
	});
})(jQuery);