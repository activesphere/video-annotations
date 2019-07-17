import { Node } from 'prosemirror-model';
import { EditorView, NodeView, Decoration } from 'prosemirror-view';
import EditorSchema from './Schema';

const fract = (n: number) => n - Math.floor(n);

const hash = (f: number) => fract(Math.sin(f) * 10000);

function clamp255(n: number) {
  return Math.min(Math.max(0, n), 255);
}

function toHex(value: number) {
  value = clamp255(value);
  value = Math.floor(value) % 255;
  let hex = value.toString(16);
  if (hex.length !== 2) {
    hex = '0' + hex;
  }
  return hex;
}

function intervalHtmlColor(startTime: number, endTime: number, fullLength: number) {
  let rn = (endTime - startTime) / fullLength;
  let gn = hash(startTime / fullLength);
  let bn = hash((endTime * startTime) & 0xffea90ff);

  rn = rn * 255;
  gn = gn * 255;
  bn = bn * 255;

  const r = toHex(rn);
  const g = toHex(gn);
  const b = toHex(bn);
  return `#${r}${g}${b}ff`;
}

class TimeBlockNodeView implements NodeView {
  _node: Node;
  _view: EditorView;
  _getPos: () => number;
  _typename: string;

  dom: HTMLElement;
  contentDOM: HTMLElement;

  constructor(node: Node, view: EditorView, getPos: () => number) {
    this._node = node;
    this._view = view;
    this._getPos = getPos;

    this._typename = node.type.name;

    this.dom = document.createElement('div');
    this.contentDOM = this.dom;

    this.dom.classList.add('time-block');

    this.update(node, []);
  }

  update(node: Node, decorations: Decoration[]) {
    if (node.type.name !== this._typename) {
      return false;
    }

    const color = intervalHtmlColor(node.attrs.startTime, node.attrs.endTime, node.attrs.duration);
    console.log('color =', color);

    this.dom.style.backgroundColor = color;
    this.dom.style.marginLeft = '10px';

    return true;
  }

  destroy() {
    this.dom.remove();
  }
}

export default TimeBlockNodeView;
