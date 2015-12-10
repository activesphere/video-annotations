var video_app = video_app || {};
(function ($) {
	video_app.annotationsView = Backbone.View.extend({
		el: 'div#annotations_list',
		events: {
			'click input.search_annotations': 'ignore',
			'keyup input.search_annotations': 'search',
			'keydown .search_annotations': 'ignore',
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
				this.addAll(this.collection.models);
			} else {
				$(this.el).html('<h3 class=center>No Annotations</h3>')
			}
		},

		addAll: function(models){
			var self = this;
			if(!_.isEmpty(models)){
				_.each(models, function (annotation) { self.addOne(annotation); });
			} else {
				this.$el.find('ul.annotations').html('<h3 class=center>No Annotations</h3>')
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
		}
	});
})(jQuery);