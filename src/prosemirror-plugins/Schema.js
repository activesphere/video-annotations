import { Schema } from 'prosemirror-model';
import { schema as BasicSchema } from 'prosemirror-schema-basic';

const ImageNodeSpec = {
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
};

const IntervalSliderNodeSpec = {
  attrs: {
    minDelta: { default: -5 },
    maxDelta: { default: 5 },
    onChange: { default: () => {} },
  },

  inline: true,
  group: 'inline',
  draggable: true,

  parseDOM: [
    {
      tag: 'intervalslider',
      getAttrs: domNode => {
        return {
          minDelta: domNode.getAttribute('minDelta'),
          maxDelta: domNode.getAttribute('maxDelta'),
        };
      },
    },
  ],
};

// Schema. Extends the basic schema with timestamps.
const EditorSchema = new Schema({
  nodes: BasicSchema.spec.nodes
    .addBefore('image', 'inlineImage', ImageNodeSpec)
    .addBefore('inlineImage', 'intervalSlider', IntervalSliderNodeSpec),
  marks: BasicSchema.spec.marks.append({
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
  }),
});

export default EditorSchema;

const ImageNodeType = EditorSchema.nodes['inlineImage'];
const IntervalSliderNodeType = EditorSchema.nodes['intervalSlider'];

export { ImageNodeType, IntervalSliderNodeType };
