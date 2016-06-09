import React from 'react';

const SearchBox = props => (
  <input
    type="text"
    placeholder={props.placeholder}
    className="center"
    onChange={props.handleSearchBoxChange}
    value={props.searchString}
    data-which={props.which}
  />
);

SearchBox.propTypes = {
  handleSearchBoxChange: React.PropTypes.func.isRequired,
  searchString: React.PropTypes.string.isRequired,
  placeholder: React.PropTypes.string,
  which: React.PropTypes.string,
};

SearchBox.defaultProps = {
  placeholder: 'type to search...',
  which: 'default',
};

export default SearchBox;
