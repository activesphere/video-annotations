// Test tooltip image. Will remove and use image associated with the timestamp.
const tooltipImageSrc = 'https://i.imgur.com/cD5ATL8.jpg';

// Helper function to get the underlying timestamp value from current selection, if one exists in
// the selection.
function getTimestampValueUnderCursor(state) {
  const { selection } = state;

  const { $from, $to } = selection;
  const marks = [...$from.marks(), ...$to.marks()];

  const times = [];

  for (const mark of marks) {
    if (mark.type.name === 'timestamp') {
      times.push(mark.attrs.videoTime);
    }
  }

  return {
    haveTimestamp: times.length !== 0,
    videoTime: Math.floor(times[0]),
  };
}

class TimestampImagePlugin {
  constructor(view) {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'timestamp-tooltip';
    view.dom.parentNode.appendChild(this.tooltip);

    this.imageElement = document.createElement('img');
    this.imageElement.setAttribute('src', tooltipImageSrc);

    this.tooltip.appendChild(this.imageElement);

    this.update(view, null);
  }

  update(view, lastState) {
    let state = view.state;

    // Don't do anything if the document/selection didn't change
    if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection)) {
      return;
    }

    if (state.selection.empty) {
      this.tooltip.style.display = 'none';
      return;
    }

    const { haveTimestamp } = getTimestampValueUnderCursor(state);

    if (!haveTimestamp) {
      this.tooltip.style.display = 'none';
      return;
    }

    this.tooltip.style.display = '';

    const { from } = state.selection;

    const start = view.coordsAtPos(from);

    this.tooltip.style.left = `${start.left + 10}px`;
    this.tooltip.style.top = `${start.top + 20}px`;
  }

  destroy() {
    this.tooltip.remove();
  }
}

export default TimestampImagePlugin;

export { getTimestampValueUnderCursor };
