import React from 'react';
import SimpleMDE from '../../vendor/simplemde.min.js';
import $ from 'jquery';

const state = {
  previousValue: null,
};

class SimpleMDEWrapper extends React.Component {
  constructor() {
    super();
    this.state = {
      keyChange: false,
    };
  }

  componentDidMount() {
    const initialOptions = {
      simplemdeement: document.getElementById('simplepostmd-editor'),
    };
    
    const allOptions = Object.assign({}, initialOptions, this.props.options);
    this.simplemde = new SimpleMDE(allOptions);
    if (this.props.options.extraKeys) {
      this.simplemde.codemirror.setOption(
        'extraKeys',
        this.props.options.extraKeys
      );
    }
    state.previousValue = this.props.options.initialValue;

    $('.CodeMirror').on('keyup', '*', () => {
      this.setState({
        keyChange: true,
      });
      this.simplemde.value();
      this.props.onChange(this.simplemde.value());
    });
    
    $('.editor-toolbar').on('click', '*', () => {
      this.props.onChange(this.simplemde.value());
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.keyChange) {
      this.simplemde.value(nextProps.value);
    }

    this.setState({
      keyChange: false,
    });
  }

  componentWillUnmount() {
    $('.CodeMirror').off('keyup', '*');
    $('.editor-toolbar').off('click', '*');
  }

  render() {
    return React.createElement('textarea', { id: 'simplepostmd-editor' });
  }
}

const dummyFunc = () => {};

SimpleMDEWrapper.defaultProps = {
  onChange: dummyFunc,
  options: {},
};

SimpleMDEWrapper.propTypes = {
  options: React.PropTypes.object.isRequired,
  onChange: React.PropTypes.func.isRequired,
};

export default SimpleMDEWrapper;
