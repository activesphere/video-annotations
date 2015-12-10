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
			this.start_seconds = 0;//second
			this.that_seconds = false;
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
				var end_seconds = parseInt(video_tag.currentTime);
				var annotation_obj = {id: uid, start_seconds: this.start_seconds, end_seconds: end_seconds, annotation: event.target.value};

				if(this.that_seconds){
					annotation_obj['start_seconds'] = end_seconds;
					annotation_obj['end_seconds'] = null;
				}

				annotation_model = new video_app.Annotation(annotation_obj);
				video_app.Annotations.add(annotation_model);
				video_tag.play();

				this.start_seconds = end_seconds;
				this.that_seconds = false;

				this.$el.empty();
			}
		}
	});
})(jQuery);