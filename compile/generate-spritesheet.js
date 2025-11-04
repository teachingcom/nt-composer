import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import Spritesmith from 'spritesmith'
import { fileToKey, asyncCallback, timeout } from './utils.js'
import paths from './paths.js'
import * as cache from './cache.js'
import { createSpritePaddedSpritesheet } from './create-sprite-padded-spritesheet'
import crypto from 'crypto';
import { HASHED_ASSET_TYPES, normalizeAssetTypeName, normalizePublicKeyName, PLURALIZED_ASSET_TYPE_NAME, SPECIAL_CATEGORIES } from './consts'


export async function generateSpritesheet (spritesheets, nodeId, spritesheetName, subdir, images, isPublic) {
  const { OUTPUT_DIR } = paths
  const knownAs = spritesheetName || nodeId;
  const src = `${subdir}${knownAs}`
  const category = subdir.substr(0, subdir.length - 1)

  // check if requires obfuscation
  let key = src
  key = normalizeAssetTypeName(key)

  // if hashing the type
  if (HASHED_ASSET_TYPES.includes(category) && !isPublic) {
    key = normalizePublicKeyName(key)
    key = crypto.createHash('sha1').update(key).digest('hex')
  }
  // pluralize certain types
  else if (SPECIAL_CATEGORIES.includes(category)) {
    key = `${category}/${knownAs}`
  }

  // get the possible paths
  const basePath = path.resolve(`${OUTPUT_DIR}/${src}`)
  const pngPath = `${basePath}.png`
  const jpgPath = `${basePath}.jpg`

  // check for certain type
  const jpgs = _.filter(images, item => /jpe?g$/i.test(item.path))
  const pngs = _.filter(images, item => /png$/i.test(item.path))

  // check for available images
  const hasPngs = _.some(pngs)
  const hasJpgs = _.some(jpgs)

  // check each time, but only if the image type is expected
  const generatedTimes = []
  if (hasPngs) generatedTimes.push(getModifiedTime(pngPath))
  if (hasJpgs) generatedTimes.push(getModifiedTime(jpgPath))
  let lastGenerated = Math.min.apply(Math, generatedTimes)
  if (isNaN(lastGenerated)) lastGenerated = 0

  // if all of the images have a lower write time
  // than the sprite sheet then we don't need to compile it again
  let expired
  for (const item of images) {
    expired = expired || item.lastModified > lastGenerated
  }

  // check if forcing a release
  // TODO: maybe move outside of this function
  if (/release/i.test(process.argv)) {
    console.log('[release] force generate', key)
    expired = true;
  }

  // check and make sure the prior data is available
  const existing = _.get(cache.data, 'spritesheets', { })[key]

  // if it's not expired and we have the old info then
  // we can just reuse it
  if (!expired && existing) {
    spritesheets[key] = existing
    return
  }

  // save the new spritesheet location
  const sprites = spritesheets[key] = { }
  sprites.version = Date.now().toString(16)

  // generate PNGs
  if (hasPngs) {
    sprites.hasPng = true
    await createSpritesheetFromImages(src, sprites, pngs, pngPath)
  }

  // generate JPGs
  if (hasJpgs) {
    sprites.hasJpg = true
    await createSpritesheetFromImages(src, sprites, jpgs, jpgPath, true)
  }

  // Images are now written directly to their final destination
  // No compression or temporary directory handling needed
}

// updates the spritesheet with image names
async function createSpritesheetFromImages (spritesheetId, sprites, images, saveTo, useSpriteAsPadding) {
  const padding = 2

  // convert to a spritesheet
  const src = _.map(images, item => item.path)
  const { image, coordinates, properties } = await asyncCallback(Spritesmith.run, { padding, src })
  const ext = path.extname(saveTo).substr(1)

  // simplify the output format
  for (const file in coordinates) {
    const bounds = coordinates[file]
    const name = fileToKey(file)

    // if this name already exists, then there's a conflict in
    // names and needs to be stopped
    if (sprites[name]) {
      throw new Error(`Conflicting sprite name: ${name} in ${spritesheetId}`)
    }

    sprites[name] = [bounds.x, bounds.y, bounds.width, bounds.height, ext]
  }

  // write the image directly to final destination
  await fs.mkdirp(path.dirname(saveTo))

  // create the padded version
  if (useSpriteAsPadding) {
    await createSpritePaddedSpritesheet(saveTo, properties.width, properties.height, coordinates, padding)
  }
  // use the normal image
  else {
    await fs.writeFile(saveTo, image, 'binary')
  }
}

// check the last modified time for a file, if it exists
function getModifiedTime (path) {
  try {
    return fs.statSync(path).mtime || 0
  } catch (ex) {
    return 0
  }
}
