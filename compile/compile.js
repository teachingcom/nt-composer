import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import * as cache from './cache.js';
import paths, { replacePaths } from './paths.js';

// resource generation approaches
import generateResource from './generate-resource.js';
import generateResourcesFromDirectory from './generate-resource-from-dir.js';
import scanDirectory from './scan-directory.js';
import generateSoundsSpritesheet from './generate-sounds-spritesheet.js';

// check if debugging mode should be used
const DEBUG = !!~process.argv.indexOf('--debug');
const VERSION = '1.0.6';

/** handles compiling all resources in the repo folder */
export async function compile(inputDir, outputDir) {
	// it's somewhat difficult to ensure the composer is
	// the correct version when used from different repos
	// this will make it known which version is being run
	console.log(`nt-composer: v${VERSION}`);
	
	// change the input/output directories
	if (inputDir && outputDir) {
		replacePaths(inputDir, outputDir);
	}

	// prepare the data
	const { INPUT_DIR, OUTPUT_DIR } = paths;
	const exported = path.resolve(`${OUTPUT_DIR}/manifest.json`);

	// load the previous document into the cache
	await cache.load(exported);

	// ensure directories
	await fs.mkdirp(OUTPUT_DIR);

	// TODO: restore data
	// check for changes
	const data = { };
	if (!('spritesheets' in data)) data.spritesheets = { };
	if (!('tracks' in data)) data.tracks = { };

	// start generating files
	await generateResource(data, data, 'particles', { });
	await generateResource(data, data, 'images', { });
	await generateResource(data, data, 'animations', { });
	await generateResource(data, data, 'emitters', { });
	await generateResource(data, data, 'crowd', { });
	
	// generate resources that have sub files
	await generateResourcesFromDirectory(data, data.trails, 'trails', { });
	await generateResourcesFromDirectory(data, data.intro, 'intros', { });
	await generateResourcesFromDirectory(data, data.nitros, 'nitros', { });
	await generateResourcesFromDirectory(data, data.cars, 'cars', { });
	await generateResourcesFromDirectory(data, data.namecards, 'namecards', { });
	await generateResourcesFromDirectory(data, data.extras, 'extras', { });

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

	// create the sounds, if needed
	await generateSoundsSpritesheet(data);

	// include animation data
	// const animations = await fs.readFile(`${INPUT_DIR}/crowd/animations.json`);
	// data.crowd = JSON.parse(animations.toString());

	// save the completed file
	const generated = JSON.stringify(data, null, DEBUG ? 2 : null);
	console.log(`[export] ${exported}`);
	await fs.writeFile(exported, generated);
}
