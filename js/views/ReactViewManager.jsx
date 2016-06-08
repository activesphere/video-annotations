import Summary from '../containers/Summary';
import React from 'react';
import ReactDOM from 'react-dom';

const ReactViewManager = {
  showSummary(videoTag) {
    const summaryTableWrapper = document.getElementById('summary-table-wrapper');
    if (summaryTableWrapper) {
      // summary box already exists; remove it
      ReactDOM.unmountComponentAtNode(
        document.getElementById('summary-page')
      );
      videoTag.play();
    } else {
      ReactDOM.render(
        <Summary />,
        document.getElementById('summary-page')
      );
      videoTag.pause();
    }
  },
};

export default ReactViewManager;
