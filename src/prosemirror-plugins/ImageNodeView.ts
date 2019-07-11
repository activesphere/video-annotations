import EditorState from './Schema';
import { EditorView } from 'prosemirror-view';
import { Node as ProsemirrorNode } from 'prosemirror-model';

const floorOrZero = (n: number) => (Number.isNaN(n) ? 0 : Math.floor(n));

class ImageNodeView {
  dom: HTMLElement;

  constructor(
    node: ProsemirrorNode<typeof EditorState>,
    view: EditorView<typeof EditorState>,
    getPos: () => number
  ) {
    const { src } = node.attrs;

    const { maxWidth, width, height, ts } = node.attrs.data || {
      maxWidth: null,
      width: 100,
      height: 100,
      ts: 0,
    };

    const outerDOM = document.createElement('span');
    outerDOM.className = 'vid-grab';
    outerDOM.style.maxWidth = `${maxWidth}px`;
    // outerDOM.style.lineHeight = '0';

    const img = document.createElement('img');
    img.className = 'vid-grab__img';
    img.setAttribute('src', src);

    const resizeHandleDOM = document.createElement('span');
    resizeHandleDOM.className = 'vid-grab__resize';

    resizeHandleDOM.onmousedown = e => {
      e.preventDefault();

      const startX = e.pageX;

      const startWidth = floorOrZero(maxWidth);

      let newWidthInPixels = startWidth;

      const onMouseMove = (e: MouseEvent) => {
        const currentX = e.pageX;

        // Don't want resizing to more than original width
        const diffInPixels = currentX - startX;
        newWidthInPixels = diffInPixels + startWidth;
        outerDOM.style.width = `${newWidthInPixels}px`;
      };

      const onMouseUp = (e: MouseEvent) => {
        e.preventDefault();

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const tr = view.state.tr
          .setNodeMarkup(getPos(), void 0, {
            src,
            data: {
              maxWidth,
              ts,
            },
            width,
            height,
          })
          .setSelection(view.state.selection);

        view.dispatch(tr);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    outerDOM.appendChild(img);
    outerDOM.appendChild(resizeHandleDOM);

    this.dom = outerDOM;
  }

  selectNode() {
    this.dom.classList.add('vid-grab--focus');
  }
  deselectNode() {
    this.dom.classList.remove('vid-grab--focus');
  }
}

export default ImageNodeView;
