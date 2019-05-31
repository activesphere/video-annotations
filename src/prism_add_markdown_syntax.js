import Prism from 'prismjs';

Prism.languages.markdown = Prism.languages.extend('markup', {});

Prism.languages.insertBefore('markdown', 'prolog', {
    blockquote: { pattern: /^>(?:[\t ]*>)*/m, alias: 'punctuation' },
    code: [
        { pattern: /^(?: {4}|\t).+/m, alias: 'keyword' },
        { pattern: /``.+?``|`[^`\n]+`/, alias: 'keyword' },
    ],
    title: [
        {
            pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/,
            alias: 'important',
            inside: { punctuation: /==+$|--+$/ },
        },
    ],

    heading1: [
        {
            pattern: /(^\s*)# .+/m,
            lookbehind: true,
            alias: 'important',
            inside: { punctuation: /^#|#$/ },
        },
    ],

    heading2: [
        {
            pattern: /(^\s*)## .+/m,
            lookbehind: true,
            alias: 'important',
            inside: { punctuation: /^##|##$/ },
        },
    ],

    heading3: [
        {
            pattern: /(^\s*)### .+/m,
            lookbehind: true,
            alias: 'important',
            inside: { punctuation: /^###|###$/ },
        },
    ],

    heading4: [
        {
            pattern: /(^\s*)#### .+/m,
            lookbehind: true,
            alias: 'important',
            inside: { punctuation: /^####|####$/ },
        },
    ],

    hr: {
        pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,
        lookbehind: true,
        alias: 'punctuation',
    },
    list: { pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m, lookbehind: true, alias: 'punctuation' },
    'url-reference': {
        pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
        inside: {
            variable: { pattern: /^(!?\[)[^\]]+/, lookbehind: true },
            string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
            punctuation: /^[[\]!:]|[<>]/,
        },
        alias: 'url',
    },
    bold: {
        pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
        lookbehind: true,
        inside: { punctuation: /^\*\*|^__|\*\*$|__$/ },
    },
    italic: {
        pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
        lookbehind: true,
        inside: { punctuation: /^[*_]|[*_]$/ },
    },
    url: {
        pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
        inside: {
            variable: { pattern: /(!?\[)[^\]]+(?=\]$)/, lookbehind: true },
            string: { pattern: /"(?:\\.|[^"\\])*"(?=\)$)/ },
        },
    },
    inlinemath: { pattern: /\$([^$]*)\$/ },
});
Prism.languages.markdown.bold.inside.url = Prism.util.clone(Prism.languages.markdown.url);
Prism.languages.markdown.italic.inside.url = Prism.util.clone(Prism.languages.markdown.url);
Prism.languages.markdown.bold.inside.italic = Prism.util.clone(Prism.languages.markdown.italic);
Prism.languages.markdown.italic.inside.bold = Prism.util.clone(Prism.languages.markdown.bold);

export default Prism;
