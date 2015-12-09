var video_app = video_app || {};
(function ($) {
	video_app.newAnnotationView = Backbone.View.extend({
		el: '#new_annotation',
		events: {
			'keydown .annotation_text': 'ignore',
			'keyup .annotation_text': 'create',
			'click .annotation_text': 'ignore',
		},

		initialize: function(){

		},

		render: function(){
			var template = "<textarea  class='annotation_text' rows='4' cols='20'></textarea>";
			this.$el.html(template);
			this.$el.find('.annotation_text').focus();
		},

		ignore: function(event) {
			event.stopPropagation();
		},

		create: function(event){
			this.ignore(event);
			if (event.keyCode == 13 && event.ctrlKey){
				console.log('Trigged');
				var uid = Date.now();
				var c_time = parseInt(video_tag.currentTime);
				ann_obj = {id: uid, time: c_time, annotation: event.target.value}
				ann_model = new video_app.Annotation(ann_obj);
				video_app.Annotations.add(ann_model);
				video_tag.play();
				this.$el.unbind();
				this.$el.empty();
			}
		}
	});
})(jQuery);