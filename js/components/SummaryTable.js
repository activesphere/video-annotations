import React from 'react';
import ReactDOM from 'react-dom';
import Utils from 'utils.js';

const TableRow = (props) => {
  let metadata = props.video.metadata;
  let annotations = props.video.annotations;
  let trClassName = props.video.active ? 'active' : 'inactive';
  let key = props.video.id;
  return (
      <tr className={trClassName}
          onClick={props.updateNotes} data-video-key={key}>
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
  let rows = props.videos.map((video) => {
    return (
        <TableRow key={video.id}
                  video={video}
                  updateNotes={props.updateNotes} />
    );
  });
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
