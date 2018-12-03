import fg from 'fast-glob'
import fs from 'fs'
import path from 'path'
import rg from 'resolve-global'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const environment = (module.exports.environment = process.env.NODE_ENV)
const packageJSON = path.resolve(process.cwd(), 'package.json')
const json = fs.existsSync(packageJSON)
    ? JSON.parse(fs.readFileSync(packageJSON, 'utf8')).mhy || {}
    : {}
export const moduleHome = path.resolve(__dirname)
const indexTemplatePath = 'src/index.html'
const indexTemplatePathProject = path.resolve(process.cwd(), indexTemplatePath)

let indexTemplatePathMhy
try {
    indexTemplatePathMhy = path.resolve(rg(`@mhy/mhy/${indexTemplatePath}`))
} catch (e) {
    indexTemplatePathMhy = path.resolve(
        `${
            process.env.NPM_CONFIG_PREFIX
        }/lib/node_modules/@mhy/mhy/${indexTemplatePath}`
    )
}

export const indexTemplate = fs.existsSync(indexTemplatePathProject)
    ? indexTemplatePathProject
    : indexTemplatePathMhy

export const load = (module, defaults = {}) => {
    applyEntries(module, 'root', defaults)
    applyEntries(module, environment, defaults)
    applyJSON(module, 'root', defaults)
    applyJSON(module, environment, defaults)
    return defaults
}

const applyEntries = (module, env, o) => {
    const entries = fg.sync([path.resolve(__dirname, module, env, '**/*')], {
        ignore: ['index.js']
    })
    for (const entry of entries) {
        const segments = entry.split(`${module}/${env}/`)[1].split('/')
        let tmp = o
        segments.forEach((v, k) => {
            if (Array.isArray(tmp)) {
                // Value is array, no need to do anything with it
            } else if (k < segments.length - 1) {
                // It's not last item

                tmp[v] = tmp[v] || {}

                if (Array.isArray(tmp[v])) {
                    tmp[v] = tmp = require(entry).default(tmp[v])
                } else {
                    tmp = tmp[v]
                }
            } else {
                // It's last item, require and execute default
                v = v.replace('.js', '')
                tmp[v] = require(entry).default(tmp[v])
            }
        })
    }
}

const applyJSON = (module, env, o, j) => {
    try {
        j = j || json[module][env] || {}
    } catch (e) {
        return
    }

    for (const [k, v] of Object.entries(j)) {
        if (!Array.isArray(v) && v instanceof Object) {
            o[k] = o[k] || v || {}
            applyJSON(module, env, o[k] || {}, v)
        } else {
            o[k] = v
        }
    }
}
