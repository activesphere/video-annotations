const floorOrZero = n => (Number.isNaN(n) ? 0 : Math.floor(n));

// Custom node view that allows you to resize images.
class ImageNodeView {
  constructor(node, view, getPos) {
    const { src } = node.attrs;

    const { maxWidth, width, height, ts } = node.attrs.data || {};

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

      const onMouseMove = e => {
        const currentX = e.pageX;

        // Don't want resizing to more than original width
        const diffInPixels = currentX - startX;
        newWidthInPixels = diffInPixels + startWidth;
        outerDOM.style.width = `${newWidthInPixels}px`;
      };

      const onMouseUp = e => {
        e.preventDefault();

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const tr = view.state.tr
          .setNodeMarkup(getPos(), null, {
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
