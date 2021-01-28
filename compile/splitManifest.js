import fs from 'fs-extra'
import path from 'path'

const SECTIONS = ['trails', 'nitros', 'cars', 'namecards']

export default async function splitManifest ({ manifest, outputDir }) {
  // save each asset type as a separate file
  for (const type of SECTIONS) {
    console.log(`[manifest] creating external manifests for ${type}`)
    const dir = path.resolve(outputDir, `./${type}`)

    // remove all existing JSON files first
    if (fs.existsSync(dir)) {
      const files = await fs.readdir(dir)
      for (const file of files) {
        if (path.extname(file) === '.json') {
          const remove = path.resolve(dir, file)
          await fs.remove(remove)
        }
      }
    }

    // copy each type into its own file
    for (const id in manifest[type]) {
      const obj = manifest[type][id]

      // is standard and shoul be included
      // in the default manifest
      if (obj.standard) {
        continue
      }

      // should be dynamically loaded
      const output = JSON.stringify(obj)
      const target = path.resolve(`${dir}/${id}.json`)
      await fs.writeFile(target, output)

      // remove this item
      delete manifest[type][id]
    }

    // remove the manifest section if nothing remains
    if (Object.keys(manifest[type]).length === 0) {
      delete manifest[type]
    }
  }
}
