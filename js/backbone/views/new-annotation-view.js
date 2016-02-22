var video_app = video_app || {};
(function ($) {


  video_app.NewAnnotationView = Backbone.View.extend({
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
      var self = this;
      setTimeout(function() {
          self.updatePosition();
      }, 20);
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

    cancel: function(e){
      e.preventDefault();
      this.video_tag.play();
      this.$el.attr({style: "right: 0px;top: 0px"});
      this.clear();
    },

    clear: function(){
      this.$el.empty();
    },

    updatePosition: function(){
      if (this.$el.find('textarea.annotation_text')) {
        var position = Utils.getNewAnnotationPosition(this.video_tag, this.$el);

        this.$el.attr(
          {style: "right: "
            + position.right + "px;top: "
            + position.top + 'px'
          }
        );
        this.$el.find(".chevron").css(position.chevronLeft);
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
