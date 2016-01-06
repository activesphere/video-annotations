var video_app = video_app || {};
(function ($) {
	video_app.annotationsView = Backbone.View.extend({
		tagName:'div',
		className: 'left_side',
		template: function () {
			return $('#annotations-template').html()
		},
		noAnnotationTemplate: function () {
			return $('#no-annotation-template').html()
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

			this.collection.on('reset', this.render);
			this.collection.on('add', this.render);
			this.collection.on('remove', this.render);

			this.collection.on('reset', this.syncAnnotations);
			this.collection.on('add', this.syncAnnotations);
			this.collection.on('remove', this.syncAnnotations);
		},

		render: function(){
			$(this.el).html(this.template());
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
		}
	});
})(jQuery);