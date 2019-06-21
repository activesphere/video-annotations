import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Snap from 'snapsvg-cjs';

import { IntervalPropType } from './Interval';

const UserSpaceDims = { w: 1.618, h: 1.0 };

class IntervalsListDOM {
  constructor(elementId) {
    this.s = Snap('#' + elementId);
    this.bgRect = this.s.rect(0, 0, UserSpaceDims.w, 0.05, 0.01, 0.01).attr({
      fill: '#efefff',
    });

    this.intervalRects = [];
  }

  // Sending
  addInterval({ start, end }, fullLength) {
    const width = ((end - start) / fullLength) * UserSpaceDims.w;
  }

  makeRectForInterval({ start, end }) {}

  clear() {
    for (const r of this.intervalRects) {
      r.remove();
    }

    this.intervalRects = [];
  }
}

const TimeBar = props => {
  const { currentInterval, videoLength, allIntervals } = props;
  const { start: intervalStart, end: intervalEnd } = currentInterval;

  const snapRef = useRef(null);

  useEffect(() => {
    snapRef.current = new IntervalsListDOM('__timebar_svg__');
  }, []);

  useEffect(() => {}, [intervalStart, intervalEnd, videoLength]);

  return <svg id="__timebar_svg__" viewBox={`0 0 ${UserSpaceDims.w} ${UserSpaceDims.h}`} />;
};

TimeBar.propTypes = {
  currentInterval: IntervalPropType,
  videoLength: PropTypes.number,
  allIntervals: PropTypes.arrayOf(IntervalPropType),
};

TimeBar.defaultProps = {
  videoLength: 600,
  currentInterval: { start: 10, end: 600 },
  allIntervals: [{ start: 10, end: 20 }, { start: 100, end: 150 }],
};

export default TimeBar;
