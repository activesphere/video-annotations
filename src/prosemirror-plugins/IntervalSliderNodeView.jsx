import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';

function intervalText(interval) {
  return `${interval}s`;
}

const ReactComponent = ({ min = -5, max = 5, onChange = () => {} }) => {
  const classes = makeStyles({
    root: {
      width: Math.abs(max - min) * 24 * 2,
    },
  });

  const [delta, setDelta] = useState(0);

  const handleChange = (event, newDelta) => {
    setDelta(newDelta);
    onChange(newDelta);
  };

  return (
    <Slider
      className={classes.root}
      min={min}
      max={max}
      onChange={handleChange}
      step={1}
      value={delta}
      marks={true}
      valueLabelDisplay="auto"
      getAriaValueText={intervalText}
    />
  );
};

class NodeView {
  constructor(pmNode, pmView, getPos) {
    this.pmNode = pmNode;
    this.pmView = pmView;

    this.dom = document.createElement('span');
    this.dom.setAttribute('intervalslider', '1');

    this._renderInDOM();
  }

  _renderInDOM() {
    const { minDelta, maxDelta, onChange } = this.pmNode.attrs;
    console.log('onChange =', onChange);
    this.mounted = true;
    ReactDOM.render(
      <ReactComponent minDelta={minDelta} maxDelta={maxDelta} onChange={onChange} />,
      this.dom
    );
  }

  update(newNode, decorations) {
    if (newNode.type !== this.pmNode.type) {
      console.log('type not same');
      return false;
    }

    this.pmNode = newNode;
    this._renderInDOM();
  }

  destroy() {
    this.mounted && ReactDOM.unmountComponentAtNode(this.dom);
    this.dom && this.dom.remove();

    this.mounted = false;
    this.dom = null;
  }
}

export default NodeView;
