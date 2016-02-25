import Backbone from 'backbone';
import _ from 'lodash';

import Annotation from 'backbone/models.js';
var Annotations = Backbone.Collection.extend({
  model: Annotation,

  initialize: function () {
    this.storage = null;
    this.dropboxFile = null;
  },

  search: function (keyword) {
    var models = this.sort('start_seconds');
    if (keyword.length !== 0) {
      models = _.filter(models, function (model) {
        if (new RegExp(keyword, 'i').test(model.get('annotation'))) return model;
      });
    }

    return models;
  },

  sort: function (field) {
    var models = _.sortBy(this.models, function (model) {
      return model.get(field);
    });

    return models;
  },

  saveDropbox: function () {
    if (this.storage && this.dropboxFile) {
      this.storage.save(this.models);
      var jsonData = _.map(this.models, function (model) { return model.toJSON();});

      this.dropboxFile.write(jsonData);
    }
  },
});

export default new Annotations();
