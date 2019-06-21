import fromPairs from './utils/fromPairs';

const keycodeOfCommandName: { [s: string]: string } = {
	toggle_pause: 'Ctrl-p',
	mark_selection_as_timestamp: 'Ctrl-t',
	turn_text_to_timestamp: 'Ctrl-y',
	put_timestamp: 'Ctrl-Shift-t',
	seek_to_timestamp: 'Ctrl-g',
	capture_frame: 'Ctrl-i',
	debug_print: 'Ctrl-d',
};

const commandNameOfKeycode = fromPairs(
	Object.entries(keycodeOfCommandName).map(([commandName, keycode]) => [keycode, commandName])
);

export { keycodeOfCommandName, commandNameOfKeycode };
