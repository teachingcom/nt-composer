import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import Spritesmith from 'spritesmith';

import { getDirectoryContents, readYml, fileToKey, asyncCallback } from './utils.js';
import { INPUT_DIR, OUTPUT_DIR } from '../paths.js';

/** generates a resource item */
export default async function generateResource(root, node, id, options) {
	const hasSubdir = !!options.subdir;
	const subdir = hasSubdir ? `${options.subdir}/` : '';
	const dir = path.resolve(`${INPUT_DIR}/${subdir}/${id}`);
	
	// if it's missing, don't bother
	// there will be a separate process to remove
	// files that no longer exist so cleanup is not required
	const exists = await fs.exists(dir);
	if (!exists) return;

	// gather file contents
	console.log('[generating]', dir);
	const { images, markup } = await getDirectoryContents(dir, options);

	// copy all YML data
	const data = { };
	for (const item of markup) {
		const contents = await readYml(item.path);
		const key = fileToKey(item.path);

		// assign the data -- for a default index file, just assign the data
		if (key === 'index') Object.assign(data, contents);
		else data[key] = contents;
	}

	// save the data, if any
	if (_.some(data)) {
		node[options.nodeId || id] = data;
	}

	// generate the spritesheet, if any
	if (_.some(images)) {
		const src = _.map(images, item => item.path);
		const { image, coordinates } = await asyncCallback(Spritesmith.run, { src });
		
		// convert to a simplified format
		const sprites = { };
		for (const file in coordinates) {
			const bounds = coordinates[file];
			const name = fileToKey(file);
			sprites[name] = [bounds.x, bounds.y, bounds.width, bounds.height];
		}

		// write spritesheet data
		const spritesheetId = `${subdir}${options.spritesheetName || id}`;
		root.spritesheets[spritesheetId] = sprites;

		// write the image
		const file = path.resolve(`${OUTPUT_DIR}/${spritesheetId}.png`);
		const targetDir = path.dirname(file);
		await fs.mkdirp(targetDir);
		await fs.writeFile(file, image, 'binary');
	}

}
