import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Utils from 'utils.js';


var TableRow = React.createClass({
  render: function () {
    var metadata = this.props.video.metadata;
    var annotations = this.props.video.annotations;
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
  }
});

var Table = React.createClass({
  render: function () {
    var rows = this.props.videos.map((video) => {
      return (<TableRow key={video.id} video={video} />);
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
  }
});

var handleStorageData = function (data) {
  // Make an array of videos{metadata,annotations}
  var storage = _.cloneDeep(data);
  var videos = [];
  _.forIn(storage, (value, key) => {
    value.id = key;
    value.metadata.url = atob(key);
    videos.push(value);
  })
  
  if (!videos.length) {
    // No annotations, yet.
    // TODO add a message saying so.
  } else {
    ReactDOM.render(<Table videos={videos} />,
                    document.getElementById('tableHolder'));
  }  
}

chrome.storage.local.get(handleStorageData);
