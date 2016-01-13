var video_app = video_app || {};
(function ($) {
	video_app.newAnnotationView = Backbone.View.extend({
		tagName: 'div',
		className: 'create-annotation',
		template: function () {
			return $('#new-annotation-template').html();
		},
		events: {
			'keyup textarea.annotation_text': 'createByEvent',
			'click a.create': 'createByClick',
			'click a.cancel': 'cancel'
		},

		initialize: function(options){
			this.start_seconds = 0;//second
			this.that_seconds = false;
			this.video_tag = options.video_tag;
			this.resize();
		},

		render: function(){
			this.$el.html(this.template());
			this.updatePosition();
			return this;
		},

		createByEvent: function(event){
			if (event.keyCode == 13 && event.altKey){
				this.createAnnotation(event.target.value);
			}
		},

		createByClick: function(event){
			event.preventDefault();
			var value = $(event.target).siblings('textarea')[0].value;
			this.createAnnotation(value);
		},

		createAnnotation: function(value){
			console.log('Trigged');
			var uid = Date.now();
			var end_seconds = parseInt(this.video_tag.currentTime);
			var annotation_obj = _.extend({
				id: uid,
				start_seconds: this.start_seconds,
				end_seconds: end_seconds
			}, Utils.splitAnnotation(value));

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

			this.video_frame.set('start_seconds', this.start_seconds);
			this.video_tag.play();

			this.clear();
		},

		cancel: function(){
			this.video_tag.play();
			this.clear();
		},

		clear: function(){
			this.$el.empty();
		},

		getStyleAttr: function(){
			var style_list = _.compact($(this.video_tag).attr('style').split('; '));
			var attr = {};
			_.each(style_list, function(list){
				attr[list.split(':')[0]] = list.split(': ')[1]
			});
			return attr;
		},

		updatePosition: function(){
			if (this.$el.find('textarea.annotation_text')) {
				var style_attr = this.getStyleAttr();
				var total_duration = this.video_tag.duration;
				var current_duration = this.video_tag.currentTime;
				var video_height = parseInt(style_attr['height']);
				var input_height = this.$el.find('textarea.annotation_text').height() + 6;
				var input_width = this.$el.find('textarea.annotation_text').width() + 8;
				var  pt = parseInt(style_attr['width']) / total_duration;
				var input_center_position = input_width / 2;
				var height = (video_height - input_height) - 95;
				var width = 0;

				if ((current_duration * pt) <= input_center_position) {
					width = parseInt(style_attr['width']) - input_width;
				} else if (((current_duration * pt) + input_center_position)>=  parseInt(style_attr['width'])) {
					width = 0;
				} else {
					width = (parseInt(style_attr['width']) - (current_duration * pt)) - input_center_position;
				}

				this.$el.attr(
					{style: "right: "
						+ Math.floor(width) + "px;top: "
						+ Math.floor(height) + 'px'
					}
				);
			}
		},

		resize: function(){
			var self = this;
			$(window).bind('resize', function(){
				self.updatePosition();
			});
		}
	});
})(jQuery);