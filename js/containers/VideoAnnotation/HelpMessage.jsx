import React from 'react';

const HelpMessage = (props) => {
  const visibility = props.visibility ? 'block' : 'none';
  console.log('visibility now is , ', visibility);
  return (
    <div className="info" style={{ display: visibility }}>
      <h3>
        <em>Video Annotations</em> helps you add annotatations to videos on Youtube
        and Coursera.
      </h3>

      <p>
      </p><h4>Shortcuts supported</h4>
      <ul>
        
        <li><strong><em>atl+d</em></strong> Create Quick Annotation</li>
        
        <li><strong><em>alt+s</em></strong> Mark start time for Annotation</li>
        
        <li><strong><em>alt+e</em></strong> Mark end time for and create Annotation</li>
        
        <li><strong><em>esc</em></strong> Close editor without creating Annotation</li>
        <br />
        
        <li><strong><em>alt+h</em></strong> Hide Annotation Editor (minimize it)</li>
        
        <li><strong><em>shift+h</em></strong> Restore hidden Annotation Editor</li>
        <br />
        
        <li><strong><em>alt+v</em></strong> Show a visual representation of all Annotations</li>
        
        <li><strong><em>shift+v</em></strong> Remove Annotations visualization</li>
        <br />
        
        <li><strong><em>shift+s</em></strong>
          Show (and hide) a summary of all annotations stored
        </li>
      </ul>
      <h4>Short cuts supported in annotation editor:</h4>
      <ul>
        
        <li><strong><em>alt+p</em></strong> Toggle video playback</li>
        
        <li><strong><em>alt+]</em></strong> Seek forward</li>
        
        <li><strong><em>alt+[</em></strong> Seek backward</li>
        
        
        <li><strong><em>alt+return</em></strong> Create/Update Annotation</li>
        
        <li><strong><em>esc</em></strong> Close editor without creating Annotation</li>
      </ul>
      <p></p>
      <p>
      </p><h4>Types of Annotations</h4>
      <ul>
        
        <li><strong><em>Quick Annotation</em></strong>
          Annotate a particular instant in the video
        </li>
        
        <li><strong><em>Standard Annotation</em></strong> Annotate a portion of the video</li>
      </ul>
      <p></p>
      <p>
        Use annotations to highlight important parts of the video, add your insights
        to an informative video, to store doubts on that lecture you want to review
        later and more. You can use markdown to craft well structured annotations.
        Annotations consist of two parts, <strong><em>the first line serves as a title for the
        annotation and rest of the annotation contains the details</em></strong>.
      </p>
    </div>
  );
};

HelpMessage.propTypes = {
  visibility: React.PropTypes.bool,
};

export default HelpMessage;
