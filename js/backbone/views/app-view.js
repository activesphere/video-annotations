var video_app = video_app || {};
(function() {
	video_app.appView = Backbone.View.extend({
		el: 'div#video-annotations',

		events: {
			'click span.left_arrow': 'showList'
		},

		initialize: function(){
			_.bindAll(this, 'render');
			this.video_tag = $('video')[0];

		},

		render: function(){
			$(this.el).html($('#app-template').html());
			this.initializeView();
			this.getVideoId();
			this.bindEvents();
		},

		initializeView: function(){
			this.new_video_view = new video_app.newAnnotationView();
			this.new_video_view.video_tag = this.video_tag;

			this.annotations_view = new video_app.annotationsView({
				collection: video_app.Annotations
			});
			this.annotations_view.render();
			this.updateStartFrame(this.new_video_view.start_seconds);
		},

		bindEvents: function(){
			var self = this;
			$(document).bind('keyup','alt+s', function(e){
				e.stopPropagation();
				self.changeframe();
			});

			$(document).bind('keyup', 'alt+e', function(e){
				e.stopPropagation();
				self.createAnnotation();
			});

			$(document).bind('keyup', 'alt+d', function(e){
				e.stopPropagation();
				self.quickAnnotation();
			});

			$(document).bind('keyup', 'alt+w', function(e){
				e.stopPropagation();
				self.closeAnnotation();
			});
		},

		createAnnotation: function(){
			this.video_tag.pause();
			this.new_video_view.render();
		},

		changeframe: function(e){
			if (this.new_video_view && this.video_tag){
				this.new_video_view.start_seconds = parseInt(this.video_tag.currentTime);
				this.updateStartFrame(this.new_video_view.start_seconds);
			}
		},

		quickAnnotation: function(e){
			if (this.new_video_view && this.video_tag){
				this.video_tag.pause();
				this.new_video_view.that_seconds = true;
				this.new_video_view.render();
			}
		},

		closeAnnotation: function(e){
			this.new_video_view.clear();
			this.video_tag.play();
		},

		updateStartFrame: function(time){
			this.$el.find('span.start_frame').html(Utils.minuteSeconds(time));
		},

		showList: function(e){
			$(e.target).fadeOut();
			this.$el.find('.left_alignment').toggle( "slide" );
		},

		getVideoId: function(){
			var current_url = window.location;
			query={};
			current_url.search.split('?')[1].split('&')
				.forEach(function(i){
					query[i.split('=')[0]]=i.split('=')[1];
				});
			this.video_id = query['v']
		}
	});
})();