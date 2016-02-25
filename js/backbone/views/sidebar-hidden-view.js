import Backbone from 'backbone';
import Mustache from 'mustache.js';
import $ from 'lib/jquery.hotkeys.js';

var SidebarHiddenView = Backbone.View.extend({
  render: function () {
  	// jscs: disable
    this.$el.html(Mustache.to_html($('#sidebar-hidden-template').html()));
    // jscs: enable
    return this;
  },
});
export default SidebarHiddenView;
