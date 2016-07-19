import React from 'react';
import './HelpMessage.less';

const HelpMessage = (props) => {
  const visibility = props.visibility ? 'block' : 'none';
  return (
    <div className="info" style={{ display: visibility }}>
      <h3>
        Video Annotations helps you add annotatations to videos on Youtube
        and Coursera.
      </h3>

      <p>
      </p><h4>Shortcuts supported</h4>
      <ul>

        <li><strong>atl+d</strong> Create Quick Annotation</li>
        <li><strong>esc</strong> Close editor without creating Annotation</li>
        <br />

        <li><strong>alt+v</strong> Toggle a visual representation of all Annotations</li>
        <li><strong>shift+s</strong>
          Show (and hide) a summary of all annotations stored
        </li>
      </ul>
      <h4>Short cuts supported in annotation editor:</h4>
      <ul>

        <li><strong>alt+p</strong> Toggle video playback</li>

        <li><strong>alt+]</strong> Seek forward</li>

        <li><strong>alt+[</strong> Seek backward</li>

        <li><strong>alt+return</strong> Create/Update Annotation</li>

        <li><strong>esc</strong> Close editor without creating Annotation</li>
      </ul>
      <p></p>
      <br />
      <p>
        Use annotations to highlight important parts of the video, add your insights
        to an informative video, to store doubts on that lecture you want to review
        later and more. You can use markdown to craft well structured annotations.
        Annotations consist of two parts, <strong>the first line serves as a title for the
        annotation and rest of the annotation contains the details</strong>.
      </p>
      <br />
    </div>
  );
};

HelpMessage.propTypes = {
  visibility: React.PropTypes.bool,
};

export default HelpMessage;
