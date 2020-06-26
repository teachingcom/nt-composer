
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import getMP3Duration from 'get-mp3-duration';
import fluent from 'fluent-ffmpeg';

import { fileToKey } from './utils.js';
import paths from './paths.js';
import getMp3Duration from 'get-mp3-duration';

// create sound sprites from 
export default async function generateSoundSprites(root) {
	const { INPUT_DIR, OUTPUT_DIR } = paths;
	const dir = 'sounds';
	const input = path.resolve(INPUT_DIR, dir)

	// collect possible sprites
	const sprites = [ ];
	const entries = await fs.readdir(input);
	for (const entry of entries) {
		
		// filter out hidden files
		if (/^\./i.test(entry)) continue;
		
		// check the file into
		const file = path.resolve(input, entry);
		const stat = await fs.stat(file);

		// if is an mp3 file
		if (isMP3(file)) {
			const buffer = await fs.readFile(file);
			const duration = getMP3Duration(buffer);
			sprites.push({ file, duration });
		}
		// is a directory -- check for more MP3 Files
		else if (stat.isDirectory()) {
			await copyMP3s(`${dir}/${entry}`);
		}

	}

	// gather the paths to concat
	const files = [ ];
	const silence = path.resolve(INPUT_DIR, 'silence.mp3');
	const silenceBuffer = await fs.readFile(silence);
	const spacer = getMp3Duration(silenceBuffer);

	// calculate the sprite info
	let duration = 0;
	root.sounds = { };
	for (const sprite of sprites) { 

		// save the file to use
		files.push(sprite.file, silence);

		// get the key
		const key = fileToKey(sprite.file);
		root.sounds[key] = [ duration, sprite.duration ];

		// update the duration - include an
		// extra 100 ms for silence between sounds
		duration += sprite.duration + spacer;
	}

	// merge the files
	const output = path.resolve(OUTPUT_DIR, `sounds/common.mp3`);
	await mergeMP3FilesToOutput(output, files);
	console.log(`[audio] ${dir}/common.mp3`);
}


// copy and compress each MP3 in a directory
async function copyMP3s(dir) {
	const { INPUT_DIR, OUTPUT_DIR } = paths;
	const input = path.resolve(INPUT_DIR, dir);
	const output = path.resolve(OUTPUT_DIR, dir);

	const entries = await fs.readdir(input);
	for (const entry of entries) {

		// ensure it's an mp3
		if (!isMP3(entry)) continue;

		// make the directory, if needed
		const exists = await fs.exists(output);
		if (!exists) await fs.mkdirp(output);

		// copy the file
		const source = path.resolve(input, entry);
		const target = path.resolve(output, entry);

		// copy the compressed version
		await copyAndCompressMP3(source, target);
		console.log(`[audio] ${dir}/${entry}`);
	}
}

// handles copying individual MP3 files
async function copyAndCompressMP3(input, output) {
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
			.mergeToFile(output);
	});
}

// merge all mp3 files into a single file
async function mergeMP3FilesToOutput(output, paths) {
	return new Promise((resolve, reject) => {
		
		// prepare the command
		const concat = fluent();
			
		// add all files
		for (const path of paths)
			concat.input(path);

		// export
		concat
			// handle events
			.on('end', resolve)
			.on('error', reject)

			// configure audio
			.audioBitrate(48)
			.audioChannels(1)

			// then merge it
			.mergeToFile(output);
	});
}

// checks if a file is an MP3 file
function isMP3(file) {
	const base = path.basename(file);
	return /\.mp3$/i.test(base);
}
