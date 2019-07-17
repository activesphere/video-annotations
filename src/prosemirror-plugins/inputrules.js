import { InputRule } from 'prosemirror-inputrules';

import EditorSchema from './Schema';
import { startTimeMarkIR, endTimeMarkIR } from './timemarker';

// Pause input rule. Typing "#." will toggle pause.
export const mkToggleVideoPauseInputRule = doCommand => {
  return new InputRule(/#\.$/, (state, match, start, end) => {
    doCommand('togglePause');
    return state.tr.insertText('', start, end);
  });
};

function makeItalic(state, match, start, end) {
  const mark = EditorSchema.marks.em.create({});
  const text = match[0];
  return state.tr
    .addStoredMark(mark)
    .insertText(text, start, end)
    .removeStoredMark(mark);
}

export const ItalicStartTimeInputRule = new InputRule(startTimeMarkIR, makeItalic);

export const ItalicEndTimeInputRule = new InputRule(endTimeMarkIR, makeItalic);
