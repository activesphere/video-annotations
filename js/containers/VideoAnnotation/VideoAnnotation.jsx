import React from 'react';

import SearchBox from '../../components/SearchBox/SearchBox';

import HelpMessage from '../../components/HelpMessage/HelpMessage';
import UserInfo from '../../components/UserInfo/UserInfo';
import Annotations from '../../components/Annotations/Annotations';

import './VideoAnnotation.less';

import { changeSearchQuery, toggleHelpMessage } from '../../actions';


class VideoAnnotation extends React.Component {
  componentDidMount() {
    this.unsubscribe = this.store.subscribe(() => this.forceUpdate());
  }

  componentWillUnmount() { this.unsubscribe(); }

  render() {
    this.store = this.context.store;
    const state = this.store.getState();
    return (
      <div id="video-annotation">
        <div className="sidebar sidebar-hidden">
          <div className="annotations-list">
            <UserInfo />
            <SearchBox
              handleSearchBoxChange={(e) => {
                this.store.dispatch(changeSearchQuery(
                  e.target.value.toLowerCase()
                ));
              }}
              searchQuery={state.searchQuery}
            />
            <div className="fa-container">
              <i
                className="fa fa-question toggle-info"
                title="Show Help"
                onClick={() => {
                  this.store.dispatch(toggleHelpMessage());
                }}
              />
              <p
                className="toggle-highlight"
                title="Show descriptions for annotations made while playing"
              >Auto Highlight</p>
              <i className="toggle-highlight fa fa-check-square-o"></i>
            </div>
            <div className="create-annotation"></div>
            <HelpMessage visibility={state.helpMessageShown} />
            <Annotations />
          </div>
        </div>
      </div>
    );
  }
}

VideoAnnotation.contextTypes = {
  store: React.PropTypes.object,
};

export default VideoAnnotation;
