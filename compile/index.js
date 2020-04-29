import _ from 'lodash';
import fs from 'fs-extra';
import Spritesmith from 'spritesmith';
import path from 'path';
import * as cache from './cache.js';
import { getDirectoryContents, readYml, asyncCallback, fileToKey } from './utils.js';

// get the root path
// __dirname does not exist anymore
const ROOT_DIR = path.resolve(path.dirname(''));
const OUTPUT_DIR = path.resolve(`${ROOT_DIR}/dist`);
const INPUT_DIR = path.resolve(`${ROOT_DIR}/resources`);

/** handles compiling all resources in the repo folder */
async function compile() {

	// ensure directories
	await fs.mkdirp(OUTPUT_DIR);

	// TODO: restore data
	// check for changes
	const data = { };
	if (!('spritesheets' in data)) data.spritesheets = { };
	if (!('cars' in data)) data.cars = { };

	// start generating files
	await generateResource(data, data, 'emitters', { spritesheetName: 'particles' });
	await generateResource(data, data, 'animations', { });

	// generate resources that have sub files
	await generateResourcesFromDirectory(data, data.trails, 'trails', { });
	await generateResourcesFromDirectory(data, data.intro, 'intros', { });
	await generateResourcesFromDirectory(data, data.nitros, 'nitros', { });
	await generateResourcesFromDirectory(data, data.tracks, 'tracks', { });
	await generateResourcesFromDirectory(data, data.cars, 'cars', { });

	// console.log(generated)
	const exported = path.resolve(`${OUTPUT_DIR}/export.json`);
	const generated = JSON.stringify(data, null, 2);
	await fs.writeFile(exported, generated);
}

/** generates a resource from each item in a directory */
async function generateResourcesFromDirectory(root, node, id, options) {
	const source = path.resolve(`${INPUT_DIR}/${id}`);

	// doesn't exist yet
	const exists = await fs.exists(source);
	if (!exists) return;

	// gather all sub folders
	const dirs = await fs.readdir(source);
	for (const dir of dirs) {
		await generateResource(root, node, dir, { nodeId: dir, subdir: id });
	}
}

/** generates a resource item */
async function generateResource(root, node, id, options) {
	const hasSubdir = !!options.subdir;
	const subdir = hasSubdir ? `${options.subdir}/` : '';
	const dir = path.resolve(`${INPUT_DIR}/${subdir}/${id}`);
	
	// if it's missing, don't bother -- this
	// there's a separate process to remove
	// files that no longer exist so cleanup is not required
	const exists = await fs.exists(dir);
	if (!exists) return;

	// gather file contents
	const { images, markup } = await getDirectoryContents(dir, options);

	// copy all YML data
	const data = node[options.nodeId || id] = { };
	for (const item of markup) {
		const contents = await readYml(item.path);
		const key = fileToKey(item.path);

		// assign the data -- for a default index file, just assign the data
		if (key === 'index') Object.assign(data, contents);
		else data[key] = contents;
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


// kick off the compile
(async () => await compile())();