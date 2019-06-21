class WithTimeRangeView {
  constructor(node, view, getPos, editorComponent) {
    console.log('Called WithTimeRangeView');
    this.dom = document.createElement('div');

    this.dom.style.display = 'flex';

    this.gutter = document.createElement('div');
    this.gutter.setAttribute('contenteditable', 'false');
    this.gutter.style.background = '#ffe0fa';
    // this.gutter.style.borderRight = '1px solid #020202';
    this.gutter.style.padding = '0 0.2rem';
    this.gutter.style.marginRight = '0.4rem';
    this.gutter.classList.add('gutter');

    this.contentDOM = document.createElement('div');
    this.contentDOM.style.flex = '1';

    this.dom.style.background = '#f2f5ff';

    this.dom.appendChild(this.gutter);
    this.dom.appendChild(this.contentDOM);
  }

  update(node) {
    if (node.type.name !== 'withTimeRange') return false;

    if (node.content.size > 0) this.dom.classList.remove('empty');
    else this.dom.classList.add('empty');

    return true;
  }

  selectNode() {
    this.img.classList.add('ProseMirror-selectednode');
  }

  deselectNode() {
    this.img.classList.remove('ProseMirror-selectednode');
  }
}

export default WithTimeRangeView;
