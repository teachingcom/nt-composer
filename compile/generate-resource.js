import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';

import { getDirectoryContents, readYml, fileToKey } from './utils.js';
import { generateSpritesheet } from './generate-spritesheet.js';
import paths from '../paths.js';

/** generates a resource item */
export default async function generateResource(root, node, id, options) {
	const { INPUT_DIR } = paths;
	const hasSubdir = !!options.subdir;
	const subdir = hasSubdir ? `${options.subdir}/` : '';
	const pathId = `${subdir}${id}`;
	const dir = path.resolve(`${INPUT_DIR}/${pathId}`);
	const nodeId = options.nodeId || id;
	
	// if it's missing, don't bother
	// there will be a separate process to remove
	// files that no longer exist so cleanup is not required
	const exists = await fs.exists(dir);
	if (!exists) return;

	// gather file contents
	console.log('[generating]', pathId);
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
		node[nodeId] = data;
	}

	// generate the spritesheet, if any
	if (_.some(images)) {
		const { spritesheetName } = options;
		await generateSpritesheet(root.spritesheets, id, spritesheetName, subdir, images);
	}

}
