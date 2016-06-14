import React from 'react';
import SearchBox from './SearchBox';
import Utils from '../utils.js';

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


const SummaryTable = (props) => {
  const rows = props.videos.filter((video) =>
    video.metadata.videoTitle.toLowerCase().indexOf(props.searchQuery) > -1
  ).map((video) =>
    <TableRow
      key={video.id}
      video={video}
      updateNotes={props.updateNotes}
    />
  );

  return (
    <div className="table-searchbox-wrapper">
      <SearchBox
        which="summarySearchBox"
        handleSearchBoxChange={props.handleSearchBoxChange}
        searchString={props.searchQuery}
        placeholder="type to search videos"
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
};

SummaryTable.propTypes = {
  videos: React.PropTypes.array,
  updateNotes: React.PropTypes.func.isRequired,
  searchQuery: React.PropTypes.string,
  handleSearchBoxChange: React.PropTypes.func.isRequired,
};

export default SummaryTable;
