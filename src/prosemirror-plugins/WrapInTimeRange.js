import { wrapIn } from 'prosemirror-commands';
import { WithTimeRangeNodeType } from './Schema';
import { MenuItem } from 'prosemirror-menu';

function makeWrapSelectionInTimeRange({ startTime, endTime, fullLength }) {
  return (state, dispatch) => {
    return wrapIn(WithTimeRangeNodeType, { startTime, endTime, fullLength })(state, dispatch);
  };
}

const wrapInTimeRangeMenuItem = new MenuItem({
  title: 'Wrap in time range',
  label: 'Wrap in time range...',
  enable: state => {
    return !state.selection.empty;
  },

  run: makeWrapSelectionInTimeRange({ startTime: 1, endTime: 100, fullLength: 600 }),
});

const unwrapTimeRangeMenuItem = new MenuItem({});

export { wrapInTimeRangeMenuItem };
