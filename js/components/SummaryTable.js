import React from 'react';
import ReactDOM from 'react-dom';
import Utils from 'utils.js';

const TableRow = (props) => {
  var metadata = props.video.metadata;
  var annotations = props.video.annotations;
  return (
      <tr>
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

const SummaryTable = (props) => {
  var rows = props.annotations.map((annotation) =>
    <TableRow key={annotation.id} video={annotation} />
  );
  return (
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
  );
};

export default SummaryTable;
