var video_app = video_app || {};
(function() {
	var Annotations = Backbone.Collection.extend({
		model: video_app.Annotation,

		search: function(keyword){
			models = this.models;
			if(keyword.length != 0){
				models = _.filter(models, function(model){
					if(new RegExp(keyword, 'i').test(model.get('annotation'))) return model;
				});
			}
			return models;

		}
	});

	video_app.Annotations = new Annotations();
})();