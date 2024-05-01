import fs from 'fs-extra'
import path from 'path'

let filePath

export async function load(src) {
  filePath = path.resolve(src)
}

export function getOverrides() {
  const overrides = { }
  try {
    const data = JSON.parse(fs.readFileSync(filePath).toString())
    Object.assign(overrides, data)
  }
  catch (ex) {
    console.error('failed to read overrides.json')
    throw ex
  }

  return overrides
}