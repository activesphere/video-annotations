import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';

type NodeSpecKeys =
  | 'doc'
  | 'time_block'
  | 'paragraph'
  | 'blockquote'
  | 'horizontal_rule'
  | 'heading'
  | 'code_block'
  | 'text'
  | 'image'
  | 'hard_break'
  | 'inlineImage';

type MarkKeys = 'link' | 'em' | 'strong' | 'code' | 'timestamp';

const NodeSpecs: { [name in NodeSpecKeys]: NodeSpec } = {
  doc: {
    content: '(block | time_block)+',
  },

  time_block: {
    attrs: {
      startTime: {},
      endTime: {},
      videoDuration: {},
    },
    content: 'block+',
    parseDOM: [{ tag: 'time-block' }],
  },

  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM: () => ['p', 0],
  },

  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM: () => ['blockquote', 0],
  },

  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM: () => ['hr'],
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

    toDOM: node => {
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
    toDOM: () => ['pre', ['code', 0]],
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
          if (dom instanceof HTMLElement) {
            return {
              src: dom.getAttribute('src'),
              title: dom.getAttribute('title'),
              alt: dom.getAttribute('alt'),
            };
          }
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
    toDOM: () => ['br'],
  },

  inlineImage: {
    attrs: {
      src: { default: '' },
      data: {
        default: null,
      },
    },
    inline: true,
    group: 'inline',
    draggable: true,

    toDOM: node => [
      'img',
      {
        'data-block-video-img': '',
        src: node.attrs.src,
        style: `width: ${node.attrs.width}; height: ${node.attrs.height}`,
        'data-img-data': JSON.stringify(node.attrs),
      },
    ],
    parseDOM: [
      {
        tag: 'img[data-block-video-img]',
        getAttrs: domNode => {
          const img = domNode as HTMLImageElement;

          const data = img.getAttribute('data-img-data');

          return {
            src: img.getAttribute('src'),
            data: data ? JSON.parse(data) : null,
          };
        },
      },
    ],
  },
};

export const marks: { [name in MarkKeys]: MarkSpec } = {
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
          if (!(dom instanceof HTMLElement)) return;

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
    toDOM: () => ['em', 0],
  },

  strong: {
    parseDOM: [
      { tag: 'strong' },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      // { tag: 'b', getAttrs: node => node.style.fontWeight !== 'normal' && null },
      // { style: 'font-weight', getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
    ],
    toDOM: () => ['strong', 0],
  },

  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM: () => ['code', 0],
  },

  timestamp: {
    attrs: { videoTime: { default: 0 } },
    toDOM: node => ['timestamp', {}],
    parseDOM: [
      {
        tag: 'timestamp',
        getAttrs: dom => {
          //          if (!(dom instanceof HTMLLinkElement)) return;

          const link = dom as HTMLLinkElement;

          return { href: link.href };
        },
      },
    ],
    inclusive: false,
  },
};

const EditorSchema = new Schema<NodeSpecKeys, MarkKeys>({ nodes: NodeSpecs, marks });

export default EditorSchema;

const ImageNodeType = EditorSchema.nodes['inlineImage'];
const TimeBlockNodeType = EditorSchema.nodes['time_block'];

export { ImageNodeType };
