import {EditorView} from 'prosemirror-view';
import {EditorState} from 'prosemirror-state';
import {schema, defaultMarkdownParser,
	defaultMarkdownSerializer} from 'prosemirror-markdown';
import {exampleSetup} from 'prosemirror-example-setup';

export class MarkdownEditor {
	constructor(content) {
		this.place = document.querySelector('#editor');
		this.view = new EditorView(this.place, {
			state: EditorState.create({
				doc: defaultMarkdownParser.parse(content),
				plugins: exampleSetup({schema})
			})
		});
	}

	set content(c) {
		this.view.updateState(EditorState.create({
			doc: defaultMarkdownParser.parse(c),
			plugins: exampleSetup({schema})
		}));
	}

	get content() {
		return defaultMarkdownSerializer.serialize(this.view.state.doc);
	}

	addText(text) {
		console.log(text);
		console.log(this.view.state.doc.content.size);

		const {tr} = this.view.state.tr;
		tr.replaceSelectionWith(defaultMarkdownParser.parse(text), true);

		const newState = this.view.state.apply(tr);
		this.view.updateState(newState);

		console.log(tr.doc.content.size);
	}

	focus() {
		this.view.focus();
	}

	destroy() {
		this.view.destroy();
	}
}
