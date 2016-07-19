import React from 'react';
import SearchBox from '../SearchBox/SearchBox';
import Utils from '../../utils.js';

import './SummaryTable.less';

const TableRow = (props) => {
  const metadata = props.video.metadata;
  const annotations = props.video.annotations;
  const trClassName = props.video.active ? 'active' : 'inactive';
  const key = props.video.id;
  return (
    <tr
      className={trClassName}
      onClick={props.updateNotes}
      data-video-key={key}
    >
      <th>{metadata.provider}</th>
      <td>
        <a href={metadata.url}>{metadata.videoTitle}</a>
      </td>
      <td>{annotations.length}</td>
      <td>{Utils.daysPassed(metadata.creationTime)} days ago</td>
      <td>{Utils.daysPassed(metadata.lastUpdate)} days ago</td>
    </tr>
  );
};

TableRow.propTypes = {
  video: React.PropTypes.object,
  updateNotes: React.PropTypes.func.isRequired,
};


class SummaryTable extends React.Component {
  constructor() {
    super();
    this.state = {
      searchQuery: '',
    };
    this.onSearchBoxChange = this.onSearchBoxChange.bind(this);
  }

  onSearchBoxChange(e) {
    this.setState({
      searchQuery: e.target.value.toLowerCase(),
    });
  }

  render() {
    const hasSearchQuery = (videoTitle, query) =>
      videoTitle.toLowerCase().indexOf(query) > -1;

    const rows = this.props.videos.filter((video) =>
      hasSearchQuery(
        video.metadata.videoTitle,
        this.state.searchQuery
      )
    ).map((video) =>
      <TableRow
        key={video.id}
        video={video}
        updateNotes={this.props.updateNotes}
      />
    );

    return (
      <div className="table-searchbox-wrapper">
        <SearchBox
          handleSearchBoxChange={this.onSearchBoxChange}
          searchString={this.state.searchQuery}
          placeholder="type to search videos"
          display="block"
        />
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Video</th>
              <th>Total Annotations</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }
}

SummaryTable.propTypes = {
  videos: React.PropTypes.array,
  updateNotes: React.PropTypes.func.isRequired,
};

export default SummaryTable;
