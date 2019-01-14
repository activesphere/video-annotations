// Key sequence syntax. Use * for symbols that can repeat. Right now only one symbol cannot be
// repeated multiple times in the same sequence. #&*<*/ is valud but #&*&*/ is not valid since & is
// being repeated twice in the second sequence. Repeats cannot be at the end of the sequence.

class TrieNode {
    constructor(c, mappedValue, repeatable = false, childrenIndices = []) {
        this.c = c;
        this.mappedValue = mappedValue;
        this.childrenIndices = [];
        this.repeatable = repeatable;
    }

    isLeaf() {
        return this.childrenIndices.length === 0;
    }
}

// Possible result after adding a character while walking the trie. From the usage side, whether the
// result is RESET and CONTINUE doesn't matter.
export const TRIE_WALKER_RESULT = {
    CONTINUE: 'continue',
    RESET: 'reset',
    MATCH: 'match',
};

export class Trie {
    constructor() {
        this.nodeStorage = [];
        const rootNode = new TrieNode('__root__', undefined);
        this.nodeStorage.push(rootNode); // Root is stored at 0

        this._doneAddingSequences = false;
    }

    rootNode() {
        return this.nodeStorage[0];
    }

    setDoneAddingSequences() {
        this._doneAddingSequences = true;
        console.log('Created trie of key-sequences\n', this.getJsonTree());
    }

    findChildWithChar(parentNode, c) {
        for (let i = 0; i < parentNode.childrenIndices.length; ++i) {
            const childIndex = parentNode.childrenIndices[i];

            const childNode = this.nodeStorage[childIndex];

            // console.log('childNode =', childNode, 'childIndex = ', childIndex, 'parentNode =', parentNode);

            if (childNode.c === c) {
                return childNode;
            }
        }
        return undefined;
    }

    // Adds a sequence to the trie along. mappedValue is the name of the command to associate with
    // the key sequence. TODO: check if added command is not a prefix of any other previously
    // inserted command. Also check repeated char is not the last in the sequence. Should be easy to
    // do.
    addSequence(sequence, mappedValue) {
        console.log(`Adding sequence ${sequence}, with mappedValue = ${mappedValue}`);

        if (this._doneAddingSequences) {
            throw Error('Trie has been marked as immutable');
        }

        if (typeof sequence !== 'string') {
            console.warn('addSequence - did not receive a string');
            return;
        }

        let currentNode = this.nodeStorage[0];
        let commonPrefixLength = 0;

        for (let i = 0; i < sequence.length; ++i) {
            const c = sequence[i];

            // Check if previous character should be repeated
            if (i !== 0 && c === '*') {
                currentNode.repeatable = true;
                console.log(`addSequence: Set ${currentNode.c} as repeatable`);
                continue;
            }

            const childNode = this.findChildWithChar(currentNode, c);

            if (!childNode) {
                commonPrefixLength = i;
                break;
            } else {
                console.log(`addSequence:  Walked common path with character ${c}`);
                currentNode = childNode;
            }
        }

        // Create new chain if the full sequence didn't match
        while (commonPrefixLength !== sequence.length) {
            const c = sequence[commonPrefixLength];

            if (c === '*') {
                console.assert(commonPrefixLength > 0);
                currentNode.repeatable = true;
                commonPrefixLength += 1;
                continue;
            }

            const newNode = new TrieNode(sequence[commonPrefixLength], mappedValue);

            console.log(`addSequence: Grew tree with character ${sequence[commonPrefixLength]}`);

            this.nodeStorage.push(newNode);
            currentNode.childrenIndices.push(this.nodeStorage.length - 1);
            currentNode = newNode;
            commonPrefixLength += 1;
        }
    }

    getJsonTree() {
        const json = {};
        this._getJsonTree(json);
        return json;
    }

    _getJsonTree(jsonObject, currentParent = this.nodeStorage[0]) {
        for (let i = 0; i < currentParent.childrenIndices.length; ++i) {
            const childIndex = currentParent.childrenIndices[i];
            const childNode = this.nodeStorage[childIndex];

            const subObject = {};
            jsonObject[childNode.c] = subObject;
            if (childNode.repeatable) {
                subObject.repeatable = true;
            }
            this._getJsonTree(subObject, childNode);
        }
    }
}

export class TrieWalker {
    constructor(trie) {
        this.trie = trie;
        this.currentNode = this.trie.nodeStorage[0];
        this.repeatCounts = {};
        this.stringLength = 0;
    }

    _addRepeatCount(c) {
        if (this.repeatCounts[c] === undefined) {
            this.repeatCounts[c] = 0;
        }
        this.repeatCounts[c] += 1;
    }

    resetManually() {
        this.currentNode = this.trie.nodeStorage[0];
        this.repeatCounts = {};
        this.stringLength = 0;
    }

    addNextChar(c) {
        if (this.currentNode.repeatable && c === this.currentNode.c) {
            this._addRepeatCount(c);
            this.stringLength += 1;
            return { name: TRIE_WALKER_RESULT.CONTINUE };
        }

        let childNode = this.trie.findChildWithChar(this.currentNode, c);

        console.log('childNode =', childNode);

        if (!childNode) {
            // Go back to root node.
            this.currentNode = this.trie.rootNode();
            this.stringLength = 0;
            this.repeatCounts = {};

            // See if this character is a child of root. If yes, make it the current node. This
            // means we are starting the match of a new sequence.
            childNode = this.trie.findChildWithChar(this.currentNode, c);

            console.assert(childNode === undefined || !childNode.isLeaf());

            if (childNode !== undefined) {
                this.currentNode = childNode;
                this.stringLength += 1;
                return { name: TRIE_WALKER_RESULT.CONTINUE };
            }

            return { name: TRIE_WALKER_RESULT.RESET };
        }

        if (childNode.isLeaf()) {
            const result = {
                name: TRIE_WALKER_RESULT.MATCH,
                mappedValue: childNode.mappedValue,
                stringLength: this.stringLength + 1,
                repeatCounts: this.repeatCounts,
            };

            this.stringLength = 0;
            this.repeatCounts = {};
            this.currentNode = this.trie.rootNode();
            return result;
        } else {
            this.stringLength += 1;
            this.currentNode = childNode;
            return { name: TRIE_WALKER_RESULT.CONTINUE };
        }
    }
}
