import path from 'path'
import gm from 'global-modules'
const fs = require('fs')

import { load } from '../'

let aliases
try {
    aliases = require('../webpack').default.resolve.alias
} catch (e) {
    aliases = {}
}
aliases = Object.entries(aliases)

const getExcludedTypes = () => {
    const pathCwd = path.resolve(process.cwd(), 'node_modules', '@types')

    if (!fs.existsSync(pathCwd)) {
        return []
    }

    const isDirectory = source => fs.lstatSync(path.join(pathCwd, source)).isDirectory()
    const getDirectories = source => fs.readdirSync(source).filter(isDirectory)
    const excluded = []

    getDirectories(pathCwd).forEach(dir => {
        const p = path.resolve(gm, '@mhy/mhy', 'node_modules', '@types', dir)
        const pFallback = path.resolve('/home/node/.npm-global/lib/node_modules/@mhy/mhy/node_modules/@types', dir)
        excluded.push(p)
        excluded.push(pFallback)
    })

    return excluded
}

const tsconfig = (module.exports = module.exports.default = load('typescript', {
    compilerOptions: {
        module: 'esNext',
        target: 'esnext',
        moduleResolution: 'node',
        allowJs: false,
        emitDeclarationOnly: true,
        strict: true,
        jsx: 'preserve',
        resolveJsonModule: true,
        esModuleInterop: true,
        noImplicitAny: false,
        declaration: true,
        typeRoots: [
            path.resolve(process.cwd(), 'node_modules', '@types'),
            path.resolve(gm, '@mhy/mhy', 'node_modules', '@types'),
            path.resolve('/home/node/.npm-global/lib/node_modules/@mhy/mhy/node_modules/@types')
        ],
        baseUrl: path.resolve(process.cwd(), 'src'),
        paths: aliases.reduce(
            function(acc, [k]) {
                const folder = k.replace('@', ``)
                acc[k] = [`${folder}/index`]
                acc[`${k}/*`] = [`${folder}/*`]
                return acc
            },
            {
                '*': [
                    path.resolve(gm, '@mhy/mhy', 'node_modules', '*'),
                    path.resolve(
                        gm,
                        '@mhy/mhy',
                        'node_modules',
                        '@types',
                        '*'
                    )
                ]
            }
        )
    },
    exclude: [
        ...getExcludedTypes()
    ],
    include: [path.resolve(process.cwd(), 'src/**/*')],
    files: [require.resolve('../../typescript/mhy.d.ts')]
}))

// Generate fresh tsconfig.json on each run
require('../_utils/tsconfig')(process.cwd(), tsconfig)
