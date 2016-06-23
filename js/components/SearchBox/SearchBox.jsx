import React from 'react';
import './SearchBox.less';

const SearchBox = props => (
  <input
    type="text"
    placeholder={props.placeholder}
    className="center"
    onChange={props.handleSearchBoxChange}
    value={props.searchString}
    style={{ display: props.display }}
  />
);

SearchBox.propTypes = {
  handleSearchBoxChange: React.PropTypes.func.isRequired,
  searchString: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  display: React.PropTypes.string,
};

SearchBox.defaultProps = {
  placeholder: 'type to search...',
  display: 'inline-block',
};

export default SearchBox;
