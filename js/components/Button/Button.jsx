import React from 'react';
import './Button.less';

const Button = props => {
  const styleOverride = props.active ?
                        { color: '#167ac6', borderColor: '#167ac6' } :
                        { color: '#7b8994', borderColor: '#d0d4d9' };
  return (
    <button
      className="button btn"
      style={styleOverride}
      onClick={props.handleButtonClick}
    >
      {props.name}
    </button>
  );
};

Button.propTypes = {
  name: React.PropTypes.string.isRequired,
  active: React.PropTypes.bool.isRequired,
  handleButtonClick: React.PropTypes.func,
};

export default Button;
