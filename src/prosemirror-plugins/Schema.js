import { Schema } from 'prosemirror-model';

const pDOM = ['p', 0];
const blockquoteDOM = ['blockquote', 0];
const hrDOM = ['hr'];
const preDOM = ['pre', ['code', 0]];
const brDOM = ['br'];

const NodeSpecs = {
  doc: {
    content: 'block+',
  },

  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return pDOM;
    },
  },

  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return blockquoteDOM;
    },
  },

  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return hrDOM;
    },
  },

  heading: {
    attrs: { level: { default: 1 } },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } },
    ],
    toDOM(node) {
      return ['h' + node.attrs.level, 0];
    },
  },

  code_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
    toDOM() {
      return preDOM;
    },
  },

  text: {
    group: 'inline',
  },

  image: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null },
    },
    group: 'inline',
    draggable: true,
    parseDOM: [
      {
        tag: 'img[src]',
        getAttrs(dom) {
          return {
            src: dom.getAttribute('src'),
            title: dom.getAttribute('title'),
            alt: dom.getAttribute('alt'),
          };
        },
      },
    ],
    toDOM(node) {
      let { src, alt, title } = node.attrs;
      return ['img', { src, alt, title }];
    },
  },

  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return brDOM;
    },
  },

  inlineImage: {
    attrs: {
      source: '',

      videoTime: { default: 0 },

      origWidth: 100,
      origHeight: 100,
      // ^ In pixels. Original dimensions of the image as received from extension. Not using these two *yet*.

      outerWidth: '10px',
    },
    inline: true,
    group: 'inline',
    draggable: true,

    // toDOM is not used
    toDOM: node => [
      'span',
      {
        style: `width: ${node.attrs.outerWidth}`,
        ...node.attrs,
      },
    ],
    parseDOM: [
      {
        tag: 'img.inline-image',
        getAttrs: domNode => {
          return {
            source: domNode.getAttribute('source'),
            videoTime: domNode.getAttribute('videoTime'),
            outerWidth: domNode.getAttribute('outerWidth'),
            origWidth: domNode.getAttribute('origWidth'),
            origHeight: domNode.getAttribute('origHeight'),
          };
        },
      },
    ],
  },
};

const emDOM = ['em', 0];
const strongDOM = ['strong', 0];
const codeDOM = ['code', 0];

export const marks = {
  link: {
    attrs: {
      href: {},
      title: { default: null },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom) {
          return { href: dom.getAttribute('href'), title: dom.getAttribute('title') };
        },
      },
    ],
    toDOM(node) {
      let { href, title } = node.attrs;
      return ['a', { href, title }, 0];
    },
  },

  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
      return emDOM;
    },
  },

  strong: {
    parseDOM: [
      { tag: 'strong' },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      { tag: 'b', getAttrs: node => node.style.fontWeight !== 'normal' && null },
      { style: 'font-weight', getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
    ],
    toDOM() {
      return strongDOM;
    },
  },

  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return codeDOM;
    },
  },

  timestamp: {
    attrs: { videoTime: 0 },
    toDOM: node => ['timestamp', {}],
    parseDOM: [
      {
        tag: 'timestamp',
        getAttrs: dom => ({ href: dom.href }),
      },
    ],
    inclusive: false,
  },
};

const EditorSchema = new Schema({ nodes: NodeSpecs, marks });

export default EditorSchema;

const ImageNodeType = EditorSchema.nodes['inlineImage'];

const WithTimeRangeNodeType = EditorSchema.nodes['withTimeRange'];

export { ImageNodeType, WithTimeRangeNodeType };
