const floorOrZero = n => (Number.isNaN(n) ? 0 : Math.floor(n));

// Custom node view that allows you to resize images.
class ImageNodeView {
    constructor(node, view, getPos) {
        const outerDOM = document.createElement('span');
        outerDOM.style.position = 'relative';
        outerDOM.style.width = node.attrs.outerWidth;
        outerDOM.style.display = 'inline-block';
        // outerDOM.style.lineHeight = '0';

        const img = document.createElement('img');
        img.setAttribute('src', node.attrs.source);
        img.setAttribute('videoTime', node.attrs.videoTime);
        img.style.width = '100%';

        const resizeHandleDOM = document.createElement('span');
        resizeHandleDOM.style.position = 'absolute';
        resizeHandleDOM.style.bottom = '0px';
        resizeHandleDOM.style.right = '0px';
        resizeHandleDOM.style.width = '10px';
        resizeHandleDOM.style.height = '10px';
        resizeHandleDOM.style.border = '3px solid black';
        resizeHandleDOM.style.borderTop = 'none';
        resizeHandleDOM.style.borderLeft = 'none';
        resizeHandleDOM.style.display = 'none';
        resizeHandleDOM.style.cursor = 'nwse-resize';

        resizeHandleDOM.onmousedown = e => {
            e.preventDefault();

            const startX = e.pageX;

            const startWidth = floorOrZero(parseFloat(node.attrs.outerWidth.match(/(.+)px/)[1]));

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
                        source: node.attrs.source,
                        outerWidth: outerDOM.style.width,
                        origWidth: node.attrs.origWidth,
                        origHeight: node.attrs.origHeight,
                    })
                    .setSelection(view.state.selection);

                view.dispatch(tr);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        outerDOM.appendChild(resizeHandleDOM);
        outerDOM.appendChild(img);

        this.dom = outerDOM;
        this.resizeHandleDOM = resizeHandleDOM;
        this.img = img;
    }

    selectNode() {
        this.img.classList.add('ProseMirror-selectednode');
        this.resizeHandleDOM.style.display = '';
    }

    deselectNode() {
        this.img.classList.remove('ProseMirror-selectednode');
        this.resizeHandleDOM.style.display = 'none';
    }
}

export default ImageNodeView;
