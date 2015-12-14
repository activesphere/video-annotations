var video_app = video_app || {};
(function() {
	var Annotations = Backbone.Collection.extend({
		model: video_app.Annotation,

		search: function(keyword){
			models = this.sort('start_seconds');
			if(keyword.length != 0){
				models = _.filter(models, function(model){
					if(new RegExp(keyword, 'i').test(model.get('annotation'))) return model;
				});
			}
			return models;
		},

		sort: function(field){
			models = this.models;
			models = _.sortBy(models, function(model){
				return model.get(field)
			});
			return models;
		}
	});

	video_app.Annotations = new Annotations();
})();