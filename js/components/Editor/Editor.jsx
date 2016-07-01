import React from 'react';
import SimpleMDEReact from '../SimpleMDEWrapper/SimpleMDEWrapper';

import './Editor.less';

class Editor extends React.Component {
  constructor() {
    super();
    this.state = {
      newAnnotationText: '',
    };
    
    this.onEditorChange = this.onEditorChange.bind(this);
    this.onCreate = this.onCreate.bind(this);
  }

  componentWillMount() {
    if (this.props.annotation) {
      this.setState({
        newAnnotationText: this.props.annotation.annotation,
      });
    }
  }

  onEditorChange(e) {
    this.setState({
      newAnnotationText: e,
    });
  }

  onCreate() {
    this.props.handleAnnotationCreate(
      this.props.start_seconds,
      this.state.newAnnotationText,
      this.props.annotation
    );
  }

  render() {
    const videoTag = this.props.videoTag;
    const defaultVal = this.props.annotation ?
                       this.props.annotation.annotation :
                       '';
    const defaultOptions = {
      autoDownloadFontAwesome: false,
      autofocus: true,
      spellChecker: true,
      hideIcons: [
        'guide',
        'heading',
        'preview',
        'fullscreen',
        'side-by-side',
      ],
      placeholder: 'Type in the text here...',
      initialValue: defaultVal,
      extraKeys: {
        Esc: () => this.props.handleAnnotationCancel(),

        'Alt-Enter': () => this.onCreate(),

        'Alt-P': () => videoTag.togglePlayback,
        'Alt-[': () => videoTag.seek('backward'),
        'Alt-]': () => videoTag.seek('forward'),
      },
    };

    return (
      <div className="create-annotation">
        <div>
          <SimpleMDEReact
            onChange={this.onEditorChange}
            options={defaultOptions}
          />
        </div>
        <div className="clear"></div>
        <div className="flex">
          <a
            href="#"
            className="button create"
            onClick={this.onCreate}
          ><i className="fa fa-plus-square"></i>Create</a>
          <a
            href="#"
            className="button cancel-create"
            onClick={this.props.handleAnnotationCancel}
          ><i className="fa fa-minus-square"></i>Cancel</a>
        </div>
      </div>
    );
  }
}

Editor.propTypes = {
  handleAnnotationCreate: React.PropTypes.func.isRequired,
  handleAnnotationCancel: React.PropTypes.func.isRequired,
  annotation: React.PropTypes.object,
  start_seconds: React.PropTypes.number,
  videoTag: React.PropTypes.object,
};

export default Editor;
