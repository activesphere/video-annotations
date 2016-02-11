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
      this.registerStorageChange();

      _.bindAll(this, 'render');
      _.bindAll(this, 'updateFrame');

      this.video_frame = new video_app.Frame({start_seconds: 0});
      this.storage = new video_app.AppStorage({name: this.video_key})
      this.userInfo = new video_app.userInfo({});

      this.fetchUser();
      this.updateVideoKey();
      this.syncData();

      this.video_frame.on('change', this.updateFrame);
      this.video_tag = $('video')[0];

      this.initializeView();
      this.bindEvents();
      this.highlight();
    },

    render: function(){
      var _this = this;
      $(this.el).html($('#app-template').html());
      this.$el.append($(this.annotations_view.render().el).hide());
      _this.updateFrame();
    },

    initializeView: function(){
      this.new_video_view = new video_app.newAnnotationView({
        video_tag: this.video_tag
      });

      this.new_video_view.video_frame = this.video_frame;

      this.annotations_view = new video_app.annotationsView({
        collection: video_app.Annotations,
        storage: this.storage,
        video_tag: this.video_tag,
        user_info: this.userInfo,
        dropbox_file: this.dropbox_file,
        arrowTag: '#video-annotations span.left_arrow'
      });
    },

    fetch: function(){
      var self = this;
      self.dropbox_file.read(function(error, annotations){
        if (!error) {
          video_app.Annotations.reset(annotations);
          self.storage.save(video_app.Annotations);
        } else {
          self.storage.get(function(annotations){
            if (annotations) {
              video_app.Annotations.reset(annotations);
            } else {
              // if no data present, update collection sliently.
              video_app.Annotations.reset([], {silent: true});
              self.annotations_view.render();
            }
          });
        }
        self.updateFrame();
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
      // query={};
      // current_url.search.split('?')[1].split('&')
      //   .forEach(function(i){
      //     query[i.split('=')[0]]=i.split('=')[1];
      //   });

      this.hostname = Utils.hosts[current_url.hostname] || '';
      this.video_key = this.base64Url(current_url.href);
      // this.getVideoId(name, query);
    },

    base64Url: function(current_url){
      return btoa(encodeURIComponent(current_url).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
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
        if ( !_.isEmpty(annotations) ) {
          self.dropbox_file.write(annotations, function(){
            self.fetch();
          });
        } else {
          self.fetch();
        }
      });
    },

    updateVideoKey: function(){
      this.storage.name = this.video_key;
      this.dropbox_file.name = this.video_key;

      //refresh object
      video_app.Annotations.storage = this.storage;
      video_app.Annotations.dropbox_file = this.dropbox_file;
    },

    fetchUser: function(){
      var self = this, user_storage = new video_app.AppStorage({name: Utils.userInfo});
      user_storage.get(function(user_info){
        _.isEmpty(user_info) ? self.userInfo.clear() : self.userInfo.set(user_info);
      });
    },

    highlight: function(){
      var self = this;

      // $(this.video_tag).on("loadeddata", function(e){
        console.log('Loaded Video');
        setInterval(function(){
          self.annotations_view.highlight();
        }, 1000);
      // });
    },

    registerStorageChange: function(){ //when changes happen in storage, this get trigger
      var self = this;
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          if (key === Utils.userInfo) {
            self.fetchUser();
          }
        }
      });
    }
  });
})($, _, video_app);