import EditorState from './Schema';
import { EditorView } from 'prosemirror-view';
import { Node as ProsemirrorNode } from 'prosemirror-model';

class ImageNodeView {
  dom: HTMLElement;
  constructor(
    node: ProsemirrorNode<typeof EditorState>,
    _view: EditorView<typeof EditorState>,
    _getPos: () => number
  ) {
    const { src } = node.attrs;

    const { maxWidth, ts } = node.attrs.data || {
      maxWidth: null,
      ts: 0,
    };

    const img = document.createElement('img');
    img.className = 'vid-grab';
    img.style.maxWidth = `${maxWidth}px`;
    img.setAttribute('src', src);
    img.onclick = () => {
      console.log('timestamp', ts); // eslint-disable-line no-console
    };

    this.dom = img;
  }

  selectNode() {
    this.dom.classList.add('vid-grab--focus');
  }
  deselectNode() {
    this.dom.classList.remove('vid-grab--focus');
  }
}

export default ImageNodeView;
