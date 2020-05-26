import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import Spritesmith from 'spritesmith';

import { fileToKey, asyncCallback } from './utils.js';
import { OUTPUT_DIR } from '../paths.js';

// access to the previous cache
import * as cache from './cache.js';

/** handles attempting to create a new spritesheet */
export async function generateSpritesheet(spritesheets, nodeId, spritesheetName, subdir, images) {
	const spritesheetId = `${subdir}${spritesheetName || nodeId}`;
	const file = path.resolve(`${OUTPUT_DIR}/${spritesheetId}.png`);

	// compare write times
	let lastGenerated;
	try {
		const stat = await fs.stat(file);
		lastGenerated = stat.mtime;
	}
	// ignore missing files and just set it to zero
	catch (ex) {
		lastGenerated = 0;
	}

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

	// expired or missing - generate it now
	console.log('[spritesheet]', spritesheetId);
	
	// convert to a spritesheet
	const src = _.map(images, item => item.path);
	const { image, coordinates } = await asyncCallback(Spritesmith.run, { src });
	
	// simplify the output format
	const sprites = { };
	for (const file in coordinates) {
		const bounds = coordinates[file];
		const name = fileToKey(file);
		sprites[name] = [bounds.x, bounds.y, bounds.width, bounds.height];
	}

	// write spritesheet data
	spritesheets[spritesheetId] = sprites;

	// write the image
	const targetDir = path.dirname(file);
	await fs.mkdirp(targetDir);
	await fs.writeFile(file, image, 'binary');
}
