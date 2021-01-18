import fs from 'fs-extra'
import path from 'path'
import fluent from 'fluent-ffmpeg'
import audiosprite from 'audiosprite'
import paths from './paths.js'
import { equalFiles } from 'file-sync-cmp'

const isMP3 = path => /\.mp3$/i.test(path)

export default async function generateSoundSprites (root) {
  const { INPUT_DIR, OUTPUT_DIR } = paths
  const dir = 'sounds'
  const input = path.resolve(INPUT_DIR, dir)

  // collect possible sprites
  const files = []
  const entries = await fs.readdir(input)
  for (const entry of entries) {
    // filter out hidden files
    if (/^\./i.test(entry)) continue

    // check the file info
    const file = path.resolve(input, entry)
    const stat = await fs.stat(file)

    // if is an mp3 file
    if (isMP3(file)) {
      files.push(file)

    // is a directory, then just copy the files
    } else if (stat.isDirectory()) {
      await copyMP3s(`${dir}/${entry}`)
    }
  }

  // check for required files
  return new Promise((resolve, reject) => {
    const tmp = path.resolve('./.compiled-audio')
    const output = path.resolve(OUTPUT_DIR, 'sounds')
    const options = {
      gap: 0.5,
      output: `${tmp}/common`
    }

    // create the spritesheet
    audiosprite(files, options, async (err, generated) => {
      if (err) {
        return reject(err)
      }

      // map all audio files
      root.sounds = { }
      for (const id in generated.spritemap) {
        const sound = generated.spritemap[id]
        root.sounds[id] = [0 | sound.start * 1000, 0 | (sound.end - sound.start) * 1000]
      }

      // compare the spritesheets to determine if they
      // changed, and if so, update the timestamp
      const source = `${tmp}/common.mp3`
      const compare = `${output}/common.mp3`
      const hasExisting = fs.existsSync(compare)
      const same = hasExisting && equalFiles(source, compare)
      if (!same) {
        root.sounds.version = Date.now().toString('16')
        console.log('[audio] updated version: common.mp3')

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
async function copyMP3s(dir) {
  const { INPUT_DIR, OUTPUT_DIR } = paths
  const input = path.resolve(INPUT_DIR, dir)
  const output = path.resolve(OUTPUT_DIR, dir)

  const entries = await fs.readdir(input)
  for (const entry of entries) {
    // ensure it's an mp3
    if (!isMP3(entry)) continue

    // make the directory, if needed
    const exists = await fs.exists(output)
    if (!exists) await fs.mkdirp(output)

    // copy the file
    const source = path.resolve(input, entry)
    const target = path.resolve(output, entry)

    // copy the compressed version
    await copyAndCompressAudio(source, target)
    console.log(`[audio] ${dir}/${entry}`)
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
