var video_app = video_app || {};

(function($, _, video_app) {
	video_app.appView = Backbone.View.extend({
		el: 'div#video-annotations',

		events: {
			'click span.left_arrow': 'showList'
		},

		initialize: function(){
			this.getVideoKey();
			this.dropbox();

			_.bindAll(this, 'render');
			_.bindAll(this, 'updateFrame');

			this.video_frame = new video_app.Frame({start_seconds: 0});
			this.storage = new video_app.AppStorage({name: this.video_key})

			this.video_frame.on('change', this.updateFrame);

			this.video_tag = $('video')[0];
			this.initializeView();
			this.bindEvents();
			this.syncData();
			this.fetch();
		},

		render: function(){
			$(this.el).html($('#app-template').html());
			this.$el.append($(this.annotations_view.render().el).hide());
			this.updateFrame();
		},

		initializeView: function(){
			this.new_video_view = new video_app.newAnnotationView({
				video_tag: this.video_tag
			});

			this.new_video_view.video_frame = this.video_frame;

			this.annotations_view = new video_app.annotationsView({
				collection: video_app.Annotations,
				storage: this.storage,
				dropbox_file: this.dropbox_file,
				arrowTag: '#video-annotations span.left_arrow'
			});
		},

		fetch: function(){
			var self = this;
			this.storage.name = this.video_key;
			self.dropbox_file.read(function(error, annotations){
				if (!error) {
					video_app.Annotations.reset(annotations);
					self.storage.save(video_app.Annotations);
				} else {
					self.storage.get(function(annotations){
						video_app.Annotations.reset(annotations || []);
					});
				}
			});
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
			this.$el.append(this.new_video_view.render().el);
			this.focusText();
		},

		changeframe: function(e){
			if (this.new_video_view && this.video_tag){
				this.new_video_view.start_seconds = parseInt(this.video_tag.currentTime);
				this.video_frame.set('start_seconds', this.new_video_view.start_seconds)
			}
		},

		quickAnnotation: function(e){
			if (this.new_video_view && this.video_tag){
				this.video_tag.pause();
				this.new_video_view.that_seconds = true;
				this.$el.append(this.new_video_view.render().el);
				this.focusText();
			}
		},

		focusText: function(){
			this.$el.find('.annotation_text').focus();
		},

		closeAnnotation: function(e){
			this.new_video_view.clear();
			this.video_tag.play();
		},

		showList: function(e){
			$(e.target).fadeOut();
			this.$el.find('.left_side').toggle( "slide" );
		},

		getVideoKey: function(){
			var current_url = window.location;
			query={};
			current_url.search.split('?')[1].split('&')
				.forEach(function(i){
					query[i.split('=')[0]]=i.split('=')[1];
				});

			var name = Utils.hosts[current_url.hostname] || '';

			this.getVideoId(name, query);
		},

		getVideoId: function(name, query){
			if (name == 'youtube'){
				this.video_key = name + "_" + query['v'];
			}
		},

		updateFrame: function(){
			this.$el.find('span.start_frame')
					.html(Utils.minuteSeconds(this.video_frame.get('start_seconds')));
		},

		dropbox: function(){
			var dropboxChrome = new Dropbox.Chrome({
				key: 'zhu541eif1aph15'
			});
			this.dropbox_file = new video_app.DropboxFile({
				dropboxObj: dropboxChrome,
				name: this.video_key
			})
		},

		syncData: function(){
			var self = this;
			self.storage.get(function(annotations){
				if (annotations) {
					self.dropbox_file.write(annotations);
				}
			});
		}
	});
})($, _, video_app);
