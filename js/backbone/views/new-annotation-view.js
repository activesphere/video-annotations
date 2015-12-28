var video_app = video_app || {};
(function ($) {
	video_app.newAnnotationView = Backbone.View.extend({
		tagName: 'div',
		className: 'create-annotation',
		events: {
			'keyup textarea.annotation_text': 'create'
		},

		initialize: function(options){
			this.start_seconds = 0;//second
			this.that_seconds = false;
			this.video_tag = options.video_tag;
			this.storage = options.storage;
		},

		render: function(){
			var template = "<textarea  class='annotation_text' rows='4'" +
				" cols='20'></textarea>";
			this.$el.html(template);
			return this;
		},

		create: function(event){
			var self = this;
			if (event.keyCode == 13 && event.altKey){
				console.log('Trigged');
				var uid = Date.now();
				var end_seconds = parseInt(this.video_tag.currentTime);
				var annotation_obj = {
					id: uid,
					start_seconds: this.start_seconds,
					end_seconds: end_seconds,
					annotation: event.target.value
				};

				if (this.that_seconds){
					annotation_obj['start_seconds'] = end_seconds;
					annotation_obj['end_seconds'] = null;
					this.that_seconds = false;
				} else {
					this.start_seconds = end_seconds;
				}

				annotation_model = new video_app.Annotation(annotation_obj);
				video_app.Annotations
					.add(annotation_model);

				self.storage.save(video_app.Annotations);

				this.video_frame.set('start_seconds', this.start_seconds);
				this.video_tag.play();

				this.clear();
			}
		},

		clear: function(){
			this.$el.empty();
		}
	});
})(jQuery);