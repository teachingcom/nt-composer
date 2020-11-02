import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import Spritesmith from 'spritesmith';
import compressImages from 'compress-images';

import COMPRESSION_PARAMS from './compression.json';
import { fileToKey, asyncCallback, timeout } from './utils.js';
import paths from './paths.js';
import * as cache from './cache.js';

// compression args
const { jpeg_quality, png_max_palette_colors } = COMPRESSION_PARAMS;
const JPG_COMPRESSION_ARGS = ['-quality', jpeg_quality];
const PNG_COMPRESSION_ARGS = [png_max_palette_colors, '-f', '--strip', '--skip-if-larger'];

export async function generateSpritesheet(spritesheets, nodeId, spritesheetName, subdir, images) {
	const { OUTPUT_DIR } = paths;
	const spritesheetId = `${subdir}${spritesheetName || nodeId}`;

	// get the possible paths
	const basePath = path.resolve(`${OUTPUT_DIR}/${spritesheetId}`);
	const pngPath = `${basePath}.png`;
	const jpgPath = `${basePath}.jpg`;

	// check for certain type
	const jpgs = _.filter(images, item => /jpe?g$/i.test(item.path));
	const pngs = _.filter(images, item => /png$/i.test(item.path));

	// check if 
	const hasPngs = _.some(pngs);
	const hasJpgs = _.some(jpgs);

	// check each time, but only if the image type is expected
	const generatedTimes = [ ];
	if (hasPngs) generatedTimes.push(getModifiedTime(pngPath));
	if (hasJpgs) generatedTimes.push(getModifiedTime(jpgPath));
	let lastGenerated = Math.min.apply(Math, generatedTimes);
	if (isNaN(lastGenerated)) lastGenerated = 0;

	// if all of the images have a lower write time
	// than the sprite sheet then we don't need to compile it again
	let expired;
	for (const item of images) {
		expired = expired || item.lastModified > lastGenerated;
	}

	// check and make sure the prior data is available
	const existing = _.get(cache.data, 'spritesheets', { })[spritesheetId];
	
	// if it's not expired and we have the old info then
	// we can just reuse it
	if (!expired && existing) {
		spritesheets[spritesheetId] = existing;
		return;
	}

	// notify of params
	console.log(`New Compress Compression Params
	jpeg_quality           : ${jpeg_quality}
	png_max_palette_colors : ${png_max_palette_colors}`);

	// save the new spritesheet location
	const sprites = spritesheets[spritesheetId] = { };

	// generate PNGs
	if (hasPngs) {
		sprites.hasPng = true;
		await createSpritesheetFromImages(spritesheetId, sprites, pngs, pngPath);
	}
	
	// generate JPGs
	if (hasJpgs) {
		sprites.hasJpg = true;
		await createSpritesheetFromImages(spritesheetId, sprites, jpgs, jpgPath);
	}
	
	// there seems to be some timing issues - give a moment to 
	// settle down before compressing - ideally, we can just
	// pipe results eventually
	await timeout(1000);

	// verify the resource directory
	const tmpId = _.snakeCase(spritesheetId);
	const resourceDir = `dist${path.dirname(basePath).substr(OUTPUT_DIR.length)}`;
	const tmpDir = `${resourceDir}/_${tmpId}`;
	await fs.mkdirp(resourceDir);

	// compress resources
	return new Promise((resolve, reject) => {
		compressImages(
			`${tmpDir}/*.{jpg,png}`, // input
			`${resourceDir}/`, // output
			{
				compress_force: true,
				statistic: true,
				autoupdate: false,
			},
			false, // ??
			{ jpg: {engine: 'mozjpeg', command: JPG_COMPRESSION_ARGS}},
			{ png: {engine: 'pngquant', command: PNG_COMPRESSION_ARGS}},
			{svg: {engine: false, command: false}},
			{gif: {engine: false, command: false}},

			// finalize
			async function(error, completed, statistic){

				// remove the temporary generation dir
				fs.remove(tmpDir);

				// check for errors
				if (error) {
					console.error(`Compression failure for ${resourceDir}`);
					console.error(error);
					resolve();
				}
				// compressed as expected
				else resolve();
			});
		});
}

// updates the spritesheet with image names
async function createSpritesheetFromImages(spritesheetId, sprites, images, saveTo) {

	// this is not ideal, but for some reason
	// padding on tracks actually creates tears in
	// the road - this is a temp fix
	const isTrack = /tracks\//.test(saveTo);
	const padding = isTrack ? 0 : 3;

	// convert to a spritesheet
	const src = _.map(images, item => item.path);
	const { image, coordinates } = await asyncCallback(Spritesmith.run, { padding, src });
	const ext = path.extname(saveTo).substr(1);
	
	// simplify the output format
	for (const file in coordinates) {
		const bounds = coordinates[file];
		const name = fileToKey(file);

		// if this name already exists, then there's a conflict in
		// names and needs to be stopped
		if (sprites[name]) {
			throw new Error(`Conflicting sprite name: ${name} in ${spritesheetId}`)
		}

		sprites[name] = [bounds.x, bounds.y, bounds.width, bounds.height, ext];
	}

	// write the image
	const tmpId = _.snakeCase(spritesheetId);
	const dir = `${path.dirname(saveTo)}/_${tmpId}`;
	const target = `${dir}/${path.basename(saveTo)}`
	await fs.mkdirp(dir);
	await fs.writeFile(target, image, 'binary');
}

// check the last modified time for a file, if it exists
function getModifiedTime(path) {
	try { return fs.statSync(path).mtime || 0; }
	catch (ex) { return 0 }
}
