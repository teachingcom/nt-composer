/** Evaluates `=(expression)` strings in manifest data. */
export default function applyMath (data) {
  walkMath(data)
}

/** @param {*} node */
function walkMath (node) {
  if (node == null || typeof node !== 'object') return

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (isMathNode(node[i])) node[i] = evaluateMathNode(node[i])
      else walkMath(node[i])
    }
    return
  }

  for (const key in node) {
    if (isMathNode(node[key])) node[key] = evaluateMathNode(node[key])
    else walkMath(node[key])
  }
}

/** @param {*} value */
function isMathNode (value) {
  return typeof value === 'string' && value.startsWith('=(') && value.endsWith(')')
}

/** @param {string} value */
function evaluateMathNode (value) {
  const expression = value.slice(2, -1)

  let result
  try {
    result = Function(`"use strict"; return (${expression})`)()
  } catch (err) {
    throw new Error(`Failed to evaluate math node ${value}: ${err.message}`)
  }

  if (typeof result !== 'number' || Number.isNaN(result)) {
    throw new Error(`Math node must evaluate to a number: ${value}`)
  }

  return result
}
