
// !!!
// NOTE: something about this version of Babel requires that
// imported files are ended with .js or .mjs - if you get an
// error about ERR_MODULE_NOT_FOUND then check that first

import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';

// resource generation approaches
import generateResource from './generate-resource.js';
import generateResourcesFromDirectory from './generate-resource-from-dir.js';

// check if debugging mode should be used
const DEBUG = !!~process.argv.indexOf('--debug');
import { OUTPUT_DIR, INPUT_DIR } from '../paths.js';

// implement a cache to check for actual changes
// to avoid constant spritesheet regeneration
import * as cache from './cache.js';
import scanDirectory from './scan-directory.js';

/** handles compiling all resources in the repo folder */
async function compile() {

	// ensure directories
	await fs.mkdirp(OUTPUT_DIR);

	// TODO: restore data
	// check for changes
	const data = { };
	if (!('spritesheets' in data)) data.spritesheets = { };
	if (!('tracks' in data)) data.tracks = { };

	// start generating files
	await generateResource(data, data, 'particles', { });
	await generateResource(data, data, 'animations', { });
	await generateResource(data, data, 'emitters', { });
	
	// general track doodads?
	// await generateResourcesFromDirectory(data, data.trails, 'doodads', { });

	// generate resources that have sub files
	await generateResourcesFromDirectory(data, data.trails, 'trails', { });
	await generateResourcesFromDirectory(data, data.intro, 'intros', { });
	await generateResourcesFromDirectory(data, data.nitros, 'nitros', { });
	await generateResourcesFromDirectory(data, data.cars, 'cars', { });

	// tracks have variations so each directory should
	// be scanned to see all available types
	await scanDirectory(`${INPUT_DIR}/tracks`, { }, async (trackName, fullTrackDir) => {

		// save the track node
		data.tracks[trackName] = { };

		// create all variations
		await scanDirectory(fullTrackDir, { }, async variant => {
			data.tracks[trackName][variant] = { };

			// generate a resource per variation
			await generateResource(data, data.tracks[trackName], variant, { 
				subdir: `tracks/${trackName}`
			});
		});
	});

	// save the completed file
	const exported = path.resolve(`${OUTPUT_DIR}/export.json`);
	const generated = JSON.stringify(data, null, DEBUG ? 2 : null);
	console.log(`[export] ${exported}`);
	await fs.writeFile(exported, generated);
}


// kick off the compile
(async () => await compile())();