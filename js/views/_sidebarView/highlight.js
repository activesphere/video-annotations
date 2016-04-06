import $ from 'jquery';
import _ from 'lodash';

export default class AutoHighlight {
  constructor(options) {
    this.$el = options.$el;
    this.videoTag = options.videoTag;
    this.collection = options.collection;

    this.bindDurationChange();
  }

  bindDurationChange() {
    $('video').on('timeupdate', this.highlight.bind(this));
  }

  unbindDurationChange() {
    $('video').unbind('timeupdate');
    this.closeHighlightedDesc();
  }

  highlight() {
    if (!_.isEmpty(this.collection.models)) {

      var currentSeconds = parseInt(this.videoTag.getCurrentTime());

      this.closeHighlightedDesc();

      _.each(this.collection.models, (model) => {
        if ((model.get('end_seconds') !== null &&
          currentSeconds >= model.get('start_seconds') &&
          currentSeconds <= model.get('end_seconds')) ||
          model.get('start_seconds') === currentSeconds) {
          this.$el.find('li.' + model.get('id') + ' .icon-title')
          .removeClass('fa-caret-right')
          .addClass('fa-caret-down');
          this.$el.find('li.' + model.get('id') + ' .annotation-description').show();
        }
      });
    }
  }

  closeHighlightedDesc() {
    _.each(this.$el.find('li'), function (li) {
      var $li = $(li);

      //Check if type auto and window opened
      if (($li.find('.icon-title').hasClass('fa-caret-down') &&
        $li.find('.icon-title').data('type') === 'auto' &&
        $li.find('div.annotation-description').css('display') === 'block')) {

        $li.find('.icon-title')
        .removeClass('fa-caret-down')
        .addClass('fa-caret-right');

        $li.find('.annotation-description').hide();
      }
    });
  }

  toggleHighlight(e) {
    var $target = $(e.target);
    if ($target.hasClass('fa-check-square-o')) {
      this.unbindDurationChange();
      $target.removeClass('fa-check-square-o').addClass('fa-square-o');
      return;
    }

    this.bindDurationChange();
    $target.removeClass('fa-square-o').addClass('fa-check-square-o');
  }
}
