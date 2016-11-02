import React from 'react';
import Utils from '../../utils';
import AppStorage from '../../localStorageUtils';

/* global chrome */

class UserInfo extends React.Component {
  constructor() {
    super();
    this.state = {
      signedIn: false,
      username: '',
      userInfo: {},
    };
    this.userStorage = new AppStorage({
      name: Utils.userInfo,
    });

    this.fetchUser = this.fetchUser.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.registerStorageChange = this.registerStorageChange.bind(this);
  }

  componentDidMount() {
    this.fetchUser();
    this.registerStorageChange();
  }

  onSignIn(e) {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'signIn' });
  }

  onSignOut(e) {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'signOut' });
    // optimistic update
    this.setState({ signedIn: false });
  }

  fetchUser() {
    this.userStorage.get((userInfo) => {
      if (userInfo && Object.keys(userInfo)) {
        this.setState({
          signedIn: true,
          username: userInfo.display_name,
          userInfo,
        });
      }
    });
  }

  registerStorageChange() {
    // when changes happen in storage, this gets triggered
    chrome.storage.onChanged.addListener((changes) => {
      Object.keys(changes).forEach((each) => {
        if (each === Utils.userInfo) {
          this.fetchUser();
        }
      });
    });
  }

  render() {
    const signedIn = this.state.signedIn;
    return (
      <div className="user-info">
        {!signedIn ?
          <div>
            <p>Your annotations are currently being saved on local storage
            &amp; may be lost</p>
            <p>Please
              <a
                href="#"
                className="sign_in"
                onClick={this.onSignIn}
              > Sign in</a> to sync with dropbox</p>
          </div> :
          <div>
            <p className="user-name">{this.state.username}</p>
            <a
              href="#"
              className="sign_out"
              onClick={this.onSignOut}
            >Sign out</a>
          </div>}
      </div>
    );
  }
}

export default UserInfo;
