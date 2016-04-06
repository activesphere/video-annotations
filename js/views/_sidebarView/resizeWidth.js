import $ from 'jquery';

export default class ResizeWidth {
  constructor($el) {
    this.$el = $el;
    this.draggable = false;
    this.bindResizeEvents();
  }

  bindResizeEvents() {
    this.$el.find('.resizer').on('mousedown', this.initDrag.bind(this));
    $(document).on('mousemove', this.doDrag.bind(this));
    $(document).on('mouseup', this.stopDrag.bind(this));
  }

  initDrag(e) {
    this.xValue = e.clientX;
    this.startWidth = parseInt(this.$el.css('width'));
    this.draggable = true;
  }

  doDrag(e) {
    e.preventDefault();
    var width = this.startWidth - e.clientX + this.xValue;
    var sidebar = this.$el;

    if (this.draggable && width > 300) {
      sidebar.css('transition', '0s');

      sidebar.css('width',
        this.startWidth - e.clientX + this.xValue + 'px'
      );

      this.$el.find('.caret').css('right', width - 1 + 'px');
    }
  }

  stopDrag() {
    this.draggable = false;
    this.$el.css('transition', '.2s');
  }
}
