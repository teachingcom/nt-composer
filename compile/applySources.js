/** Resolves `[:source, key, ...args]` references in manifest data. */
export default function applySources (data, sources) {
  if (sources == null || typeof sources !== 'object') return
  walkSources(data, sources)
}

/** @param {*} node @param {Record<string, *>} sources */
function walkSources (node, sources) {
  if (node == null || typeof node !== 'object') return

  let activeSources = sources
  if (!Array.isArray(node) && node.sources != null && typeof node.sources === 'object') {
    activeSources = node.sources
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (isSourceNode(node[i])) node[i] = resolveSourceNode(node[i], activeSources)
      else walkSources(node[i], activeSources)
    }
    return
  }

  for (const key in node) {
    if (key === 'sources') continue
    if (isSourceNode(node[key])) node[key] = resolveSourceNode(node[key], activeSources)
    else walkSources(node[key], activeSources)
  }
}

/** @param {*} value */
function isSourceNode (value) {
  return Array.isArray(value) && value[0] === ':source'
}

/** @param {unknown[]} value @param {Record<string, *>} sources */
function resolveSourceNode (value, sources) {
  const key = value[1]
  const args = value.slice(2)

  if (typeof key !== 'string' || !key) {
    throw new Error(`Source node requires a key: ${JSON.stringify(value)}`)
  }

  if (!(key in sources)) {
    throw new Error(`Unknown source key "${key}"`)
  }

  const cloned = cloneValue(sources[key])

  if (Array.isArray(cloned)) {
    return [...cloned, ...args]
  }

  if (cloned !== null && typeof cloned === 'object') {
    const result = { ...cloned }
    for (const arg of args) {
      if (arg == null || typeof arg !== 'object' || Array.isArray(arg)) {
        throw new Error(`Source node object args must be objects: ${JSON.stringify(value)}`)
      }
      Object.assign(result, arg)
    }
    return result
  }

  if (args.length) {
    throw new Error(`Source node cannot apply args to scalar source: ${JSON.stringify(value)}`)
  }

  return cloned
}

/** @param {*} value */
function cloneValue (value) {
  return JSON.parse(JSON.stringify(value))
}
