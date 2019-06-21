import PropTypes from 'prop-types';

const IntervalPropType = PropTypes.shape({ start: PropTypes.number, end: PropTypes.number });

const intervalIsLessThan = (i0, i1) => i0.start < i1.start || i0.end - i0.start < i1.start - i1.end;

function insertInterval(intervalList, interval) {
  intervalList.push(interval);

  for (let i = intervalList.length - 1; i > 0; --i) {
    if (intervalIsLessThan(intervalList[i], intervalList[i - 1])) {
      const t = intervalList[i];
      intervalList[i] = intervalList[i - 1];
      intervalList[i - 1] = t;
    }
  }

  return intervalList;
}

function toHex(value) {
  // value = Math.min(Math.max(0, value), 255);
  value = Math.floor(value) % 255;
  let hex = value.toString(16);
  if (hex.length != 2) {
    hex = '0' + hex;
  }
  return hex;
}

function intervalHtmlColor({ startTime, endTime, fullLength }) {
  const r = toHex((endTime - startTime) * startTime);
  const g = toHex((endTime * startTime) / (endTime - startTime));
  const b = toHex((endTime * endTime) << Math.floor(Math.log2(startTime)));
  return `#${r}${g}${b}ff`;
}

export { IntervalPropType, intervalIsLessThan, insertInterval };
