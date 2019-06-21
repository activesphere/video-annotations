class DocView {
  constructor(node) {
    console.log('Called doc node view');
    this.dom = document.createElement('div');

    this.dom.style.display = 'flex';

    this.gutter = document.createElement('div');
    this.gutter.setAttribute('contenteditable', 'false');
    this.gutter.style.background = '#fffaea';
    // this.gutter.style.borderRight = '1px solid #020202';
    this.gutter.style.padding = '0 0.5rem';
    this.gutter.style.marginRight = '0.8rem';
    this.gutter.classList.add('gutter');

    this.contentDOM = document.createElement('div');
    this.contentDOM.style.flex = '1';

    this.dom.appendChild(this.gutter);
    this.dom.appendChild(this.contentDOM);
  }

  update(node) {
    if (node.type.name != 'doc') return false;

    if (node.content.size > 0) this.dom.classList.remove('empty');
    else this.dom.classList.add('empty');

    return true;
  }
}

export default DocView;
