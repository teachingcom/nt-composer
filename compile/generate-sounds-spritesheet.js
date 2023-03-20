import fs from 'fs-extra'
import path from 'path'
import fluent from 'fluent-ffmpeg'
import audiosprite from 'audiosprite'
import paths from './paths.js'
import glob from 'glob'
import { equalFiles } from 'file-sync-cmp'
import { asyncCallback } from './utils.js'

const isMP3 = path => /\.mp3$/i.test(path)

export default async function generateSoundSprites (root, cache) {
  // check for new sounds to compile
  const hasUpdatedSounds = await checkForUpdatedSounds(cache)
  if (!hasUpdatedSounds) {
    root.sounds = cache.data.sounds
    return
  }

  root.sounds = { }

  // find all collections of audio
  const { INPUT_DIR } = paths
  const dir = 'sounds/collections'
  const collections = path.resolve(INPUT_DIR, dir)
  const items = await fs.readdir(collections);

  // generate each unique sound spritesheet
  for (const name of items) {
    const location = path.resolve(collections, name)
    const stat = await fs.stat(location)
    if (stat.isDirectory() && !/^\./.test(name)) {
      await generateCollectionSoundSprites(root, name, location)
    }
  }

  // copy other individual sounds
  await copyIndividualSounds(root)
}

async function checkForUpdatedSounds(cache) {
  const { INPUT_DIR } = paths
  const files = await asyncCallback(glob, `${INPUT_DIR}/sounds/**/*.mp3`)
  
  // find the latest timestamp
  const ts = parseInt(cache.data?.version, '16')

  // see if anything is newer
  for (const file of files) {
    const stat = fs.statSync(file)
    if (stat.mtimeMs > ts) {
      return true
    }
  }

  // nothing new
  return false
}

async function copyIndividualSounds(root) {
  const { INPUT_DIR, OUTPUT_DIR } = paths
  const dir = 'sounds'
  const collections = path.resolve(INPUT_DIR, dir)
  const items = await fs.readdir(collections);

  // generate each unique sound spritesheet
  for (const name of items) {
    const location = path.resolve(collections, name)
    const stat = await fs.stat(location)
    if (stat.isDirectory() && name !== 'collections' && !/^\./.test(name)) {
      const type = path.basename(location);
      const output = path.resolve(`${OUTPUT_DIR}/sounds/${type}`)

      // check for mp3s
      const files = fs.readdirSync(location).filter(item => /\.mp3/i.test(item))
      for (const file of files) {
        const sound = file.replace(/\.mp3$/, '');
        const copyFrom = path.resolve(location, file)
        const saveTo = path.resolve(output, file)
        const fileStat = fs.statSync(copyFrom)

        // find the latest timestamp
        const ts = 0 | fileStat.mtimeMs.toString(16);
        
        // mark this as a sound that exists
        const key = `${name}/${sound}`;
        root.sounds[key] = ts;
        
        // write the file
        console.log('[sound]', key)
        copyAndCompressAudio(copyFrom, saveTo)
      }
    }
  }
}

async function generateCollectionSoundSprites(root, name, location) {
  const { OUTPUT_DIR } = paths

  // collect possible sprites
  const files = []
  const entries = await fs.readdir(location)
  for (const entry of entries) {
    // filter out hidden files
    if (/^\./i.test(entry)) continue

    // check the file info
    const file = path.resolve(location, entry)

    // if is an mp3 file
    if (isMP3(file)) {
      files.push(file)
    }
  }
  
  // create the sound record
  const record = root.sounds[name] = { }

  // check for required files
  return new Promise((resolve, reject) => {
    const tmp = path.resolve('./.compiled-audio')
    const output = path.resolve(OUTPUT_DIR, 'sounds')
    const options = {
      gap: 0.5,
      output: `${tmp}/${name}`
    }

    // create the spritesheet
    audiosprite(files, options, async (err, generated) => {
      if (err) {
        return reject(err)
      }

      // map all audio files
      for (const id in generated.spritemap) {
        const sound = generated.spritemap[id]
        record[id] = [0 | sound.start * 1000, 0 | (sound.end - sound.start) * 1000]
      }

      // compare the spritesheets to determine if they
      // changed, and if so, update the timestamp
      const source = `${tmp}/${name}.mp3`
      const compare = `${output}/${name}.mp3`
      const hasExisting = fs.existsSync(compare)
      const same = hasExisting && equalFiles(source, compare)
      if (!same) {
        record.version = Date.now().toString('16')
        console.log(`[audio] updated version: ${name}.mp3`)

        // copy and compress each
        const files = fs.readdirSync(tmp)
        for (const file of files) {
          const copyFrom = path.resolve(tmp, file)
          const copyTo = path.resolve(output, file)
          await copyAndCompressAudio(copyFrom, copyTo)
        }
      }

      resolve()
    })
  })
}

// copy and compress each MP3 in a directory
async function copyMP3s(root, dir, { input, output }) {
  const { INPUT_DIR, OUTPUT_DIR } = paths
  
  if (!input) {
    input = path.resolve(INPUT_DIR, dir)
  }

  if (!output) {
    output = path.resolve(OUTPUT_DIR, dir)
  }

  const entries = await fs.readdir(input)
  for (const entry of entries) {
    // ensure it's an mp3
    if (!isMP3(entry)) continue

    // make the directory, if needed
    const exists = await fs.exists(output)
    if (!exists) await fs.mkdirp(output)

    // copy the file
    const key = `${dir}/${entry}`;
    const source = path.resolve(input, entry)
    const target = path.resolve(output, entry)
    const stat = await fs.stat(source)

    // copy the compressed version
    root.sounds[key] = stat.mtime.toString('16')
    await copyAndCompressAudio(source, target)
    console.log(`[audio] ${key}`)
  }
}

// handles copying individual MP3 files
async function copyAndCompressAudio(input, output) {
  return new Promise((resolve, reject) => {
    fluent()

      // get the file top copy
      .input(input)

      // handle events
      .on('end', resolve)
      .on('error', reject)

      // configure audio
      .audioBitrate(48)
      .audioChannels(1)

      // then merge it
      .mergeToFile(output)
  })
}
