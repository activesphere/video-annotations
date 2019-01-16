export const TEST_CONTENT_0 = {
    blocks: [
        {
            key: 'fna88',
            text:
                "It is the same!—For, be it joy or sorrow,\n    The path of its departure still is free;\nMan's yesterday may ne'er be like his morrow;\n    Nought may endure but Mutability.\n",
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
    ],
    entityMap: {},
};

export const TEST_CONTENT_1 = {
    blocks: [
        {
            key: 'fna88',
            text:
                "It is the same!—For, be it joy or sorrow,\n    The path of its 0:0:0 departure still is free;\nMan's yesterday may ne'er be like his morrow;\n    Nought may endure but Mutability.\n",
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [{ offset: 62, length: 5, key: 0 }],
            data: {},
        },
    ],
    entityMap: {
        '0': {
            type: 'VIDEO_TIMESTAMP',
            mutability: 'MUTABLE',
            data: {
                url: 'http://www.youtube.com/watch?v=6orsmFndx_o&t=0m0s',
                videoId: '6orsmFndx_o',
                videoTime: 0,
            },
        },
    },
};

// This one fails to load
export const TEST_CONTENT_2 = {
    blocks: [
        {
            key: 'fna88',
            text: 'It is the same!—For, be it joy or sorrow,',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: '2283p',
            text: '\n    The path of its 0:0:0 departure still is free;',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [{ offset: 21, length: 5, key: 0 }],
            data: {},
        },
        {
            key: 'cuc43',
            text:
                "\nMan's yesterday may ne'er be like his morrow;\n    Nought may endure but Mutability.",
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: '5h1a3',
            text: '',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: '9an0c',
            text: '0:1:30 ',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [{ offset: 0, length: 6, key: 1 }],
            data: {},
        },
        {
            key: '60do9',
            text: '',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: 'cqedb',
            text: '                             -- P. B. Shelley',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: '4e1n1',
            text: '',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: '3gcnh',
            text: '',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
        {
            key: '2qmgk',
            text: '',
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        },
    ],
    entityMap: {
        '0': {
            type: 'VIDEO_TIMESTAMP',
            mutability: 'MUTABLE',
            data: {
                url: 'http://www.youtube.com/watch?v=6orsmFndx_o&t=0m0s',
                videoId: '6orsmFndx_o',
                videoTime: 0,
            },
        },
        '1': {
            type: 'VIDEO_TIMESTAMP',
            mutability: 'MUTABLE',
            data: {
                url: 'http://www.youtube.com/watch?v=6orsmFndx_o&t=1m30s',
                videoId: '6orsmFndx_o',
                videoTime: 89.82380594850159,
            },
        },
    },
};
