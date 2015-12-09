var video_app = video_app || {};
(function ($) {
	video_app.annotationsView = Backbone.View.extend({
		el: '#annotations_list',
		events: {

		},

		initialize: function(){
			_.bindAll(this, 'render');
			this.collection.on('reset', this.render);
			this.collection.on('add', this.render);
		},

		render: function(){
			this.$el.empty();
			this.addAll();
		},

		addAll: function(){
			var self = this;
			if(!_.isEmpty(this.collection.models)){
				_.each(self.collection.models, function (annotation) { self.addOne(annotation); });
			}
		},

		addOne: function(annotation){
			var view = new video_app.annotationView({model: annotation});
			this.$el.append(view.render().el);
		}
	});
})(jQuery);