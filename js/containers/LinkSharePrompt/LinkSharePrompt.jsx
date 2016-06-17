import React from 'react';

import Button from '../../components/Button/Button';

import Utils from '../../utils';
import { creatingURL } from '../../syncService';

import './LinkSharePrompt.less';


class LinkSharePrompt extends React.Component {
  constructor() {
    super();
    this.onCreateLinkClick = this.onCreateLinkClick.bind(this);
    this.onCopyLinkClick = this.onCopyLinkClick.bind(this);
    this.state = {
      promptButtonName: 'Create Link',
      promptButtonActive: true,
      activeButtonHandler: this.onCreateLinkClick,
      inputBoxValue: '',
    };
  }

  onCopyLinkClick() {
    const inp = document.querySelector('.url-selector');
    inp.select();
    document.execCommand('copy');
    
    this.changeButtonState(
      'Close',
      true,
      this.props.handlePromptClose
    );
  }

  onCreateLinkClick() {
    // show - the URL is loading, through button state
    this.changeButtonState('Loading...', false);
    // fetch the public URL from DropBox
    this.dropboxFile = Utils.dropbox(this.props.activeNotesKey);
    
    creatingURL(this.dropboxFile).then((url) => {
      this.setState({ inputBoxValue: url });
      this.changeButtonState('Copy Link', true, this.onCopyLinkClick);
    });
  }

  changeButtonState(promptButtonName, promptButtonActive, activeButtonHandler) {
    if (activeButtonHandler) this.setState({ activeButtonHandler });
    this.setState({
      promptButtonName,
      promptButtonActive,
    });
  }

  render() {
    return (
      <div className="link-share-box-parent">
        <div className="link-share-box">
          <a
            href="#"
            className="prompt-closer"
            onClick={this.props.handlePromptClose}
          >
            <i className="fa fa-times" aria-hidden="true"></i>
          </a>
          <h3>Get a Public link to these Notes</h3>
          <div className="link-action-bar">
            <input
              readOnly
              className="url-selector"
              style={{ border: 'none', width: '200px' }}
              value={this.state.inputBoxValue}
            />
            <Button
              name={this.state.promptButtonName}
              active={this.state.promptButtonActive}
              handleButtonClick={this.state.activeButtonHandler}
            />
          </div>
        </div>
      </div>
    );
  }
}

LinkSharePrompt.propTypes = {
  activeNotesKey: React.PropTypes.string.isRequired,
  handlePromptClose: React.PropTypes.func.isRequired,
};

export default LinkSharePrompt;
