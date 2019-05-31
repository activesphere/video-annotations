/* eslint-disable */

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault(ex) {
    return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var isHotkey = _interopDefault(require('is-hotkey'));
var typeOf = _interopDefault(require('type-of'));

/**
 * A Slate plugin to automatically replace a block when a string of matching
 * text is typed.
 *
 * @param {Object} opts
 * @return {Object}
 */

function AutoReplace() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!opts.change) throw new Error('You must provide a `change` option.');
    if (!opts.trigger) throw new Error('You must provide a `trigger` option.');

    var trigger = normalizeTrigger(opts.trigger);

    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Change} change
     * @param {Function} next
     * @return {Value}
     */

    function onKeyDown(event, change, next) {
        if (!trigger(event, change, next)) {
            return next();
        }

        var value = change.value;
        var selection = value.selection;

        if (selection.isExpanded) return next();

        var startBlock = value.startBlock;

        if (!startBlock) return next();

        var matches = getMatches(value);
        if (!matches) return next();

        console.log('Matches =', matches);

        event.preventDefault();

        var start = selection.start;

        var startOffset = start.offset;
        var totalRemoved = 0;
        var offsets = getOffsets(matches, startOffset);

        // @rksht - Only want to delete submatch 0. Commenting this out for now.

        /*
        offsets.forEach(function(offset) {
            console.log(
                'Offset found = ',
                offset,
                'text =',
                change.value.document.getTextAtOffset(offset)
            );

            change
                .moveAnchorTo(offset.start)
                .moveFocusTo(offset.end)
                .delete();

            totalRemoved += offset.total;
        });
        */

        // And adding this
        if (offsets.length > 0) {
            var offset = offsets[0];
            change
                .moveAnchorTo(offset.start)
                .moveFocusTo(offset.end)
                .delete();

            totalRemoved += offset.total;
        }

        startOffset -= totalRemoved;
        change.moveTo(startOffset);
        change.call(opts.change, event, matches);
    }

    /**
     * Try to match the current text of a `value` with the `before` and
     * `after` regexes.
     *
     * @param {Value} value
     * @return {Object}
     */

    function getMatches(value) {
        var selection = value.selection,
            startText = value.startText;
        var start = selection.start;
        var text = startText.text;

        var after = null;
        var before = null;

        if (opts.after) {
            var string = text.slice(start.offset);
            after = string.match(opts.after);
        }

        if (opts.before) {
            var _string = text.slice(0, start.offset);
            before = _string.match(opts.before);
        }

        // If both sides, require that both are matched, otherwise null.
        if (opts.before && opts.after && !before) after = null;
        if (opts.before && opts.after && !after) before = null;

        // Return null unless we have a match.
        if (!before && !after) return null;

        if (after) after[0] = after[0].replace(/\s+$/, '');
        if (before) before[0] = before[0].replace(/^\s+/, '');

        return { before: before, after: after };
    }

    /**
     * Return the offsets for `matches` with `start` offset.
     *
     * @param {Object} matches
     * @param {Number} start
     * @return {Object}
     */

    function getOffsets(matches, start) {
        var before = matches.before,
            after = matches.after;

        var offsets = [];
        var totalRemoved = 0;

        if (before) {
            var match = before[0];
            var startOffset = 0;
            var matchIndex = 0;

            before.slice(1, before.length).forEach(function(current) {
                if (current === undefined) return;

                matchIndex = match.indexOf(current, matchIndex);
                startOffset = start - totalRemoved + matchIndex - match.length;

                offsets.push({
                    start: startOffset,
                    end: startOffset + current.length,
                    total: current.length,
                });

                totalRemoved += current.length;
                matchIndex += current.length;
            });
        }

        if (after) {
            var _match = after[0];
            var _startOffset = 0;
            var _matchIndex = 0;

            after.slice(1, after.length).forEach(function(current) {
                if (current === undefined) return;

                _matchIndex = _match.indexOf(current, _matchIndex);
                _startOffset = start - totalRemoved + _matchIndex;

                offsets.push({
                    start: _startOffset,
                    end: _startOffset + current.length,
                    total: 0,
                });

                totalRemoved += current.length;
                _matchIndex += current.length;
            });
        }

        return offsets;
    }

    /**
     * Return the plugin.
     *
     * @type {Object}
     */

    return { onKeyDown: onKeyDown };
}

/**
 * Normalize a `trigger` option to a matching function.
 *
 * @param {Mixed} trigger
 * @return {Function}
 */

function normalizeTrigger(trigger) {
    switch (typeOf(trigger)) {
        case 'function':
            console.log('function');
            return trigger;
        case 'regexp':
            console.log('function');
            return function(event) {
                return !!(event.key && event.key.match(trigger));
            };
        case 'string':
            const b = isHotkey(trigger);
            return b;

        default:
            return undefined;
    }
}

exports.default = AutoReplace;
//# sourceMappingURL=slate-auto-replace.js.map
