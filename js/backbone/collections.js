var video_app = video_app || {};
(function() {
  var Annotations = Backbone.Collection.extend({
    model: video_app.Annotation,

    initialize: function(){
      this.storage = null;
      this.dropbox_file = null;
    },

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
    },

    saveDropbox: function(){
      if (this.storage && this.dropbox_file) {
        this.storage.save(this.models);
        json_data = _.map(this.models, function(model){ return model.toJSON() });
        this.dropbox_file.write(json_data);
      }
    }
  });

  video_app.Annotations = new Annotations();
})();