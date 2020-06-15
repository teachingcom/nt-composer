import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import yml from 'js-yaml';

/** reads a YML file */
export async function readYml(path) {

	// make sure this exists
	const exists = await fs.exists(path);
	if (!exists) return null;

	// try and read the content
	try {
		const contents = await fs.readFile(path);
		return yml.load(contents.toString());
	}
	catch (ex) {
		console.error(`YAML Error in ${path}`);
		throw ex;
	}
}

/** gather up contents for a directory */
export async function getDirectoryContents(dir) {
	let markup = [ ];
	let images = [ ];

	// get modified times for each file
	const files = await fs.readdir(dir);
	for (let file of files) {

		// get the source
		const source = path.resolve(`${dir}/${file}`);
		const stat = await fs.stat(source);
		const isDirectory = stat.isDirectory();
		const lastModified = +stat.mtime;
		const ext = path.extname(file);
		
		// skip directories and hidden files
		if (isDirectory || file[0] === '.') continue;

		// add to the correct group
		const ref = !!~['.yml', '.yaml'].indexOf(ext) ? markup
			: !!~['.jpg', '.jpeg', '.png'].indexOf(ext) ? images
			: null;

		// create the record
		if (ref) ref.push({ path: source, lastModified });
	}

	return { markup, images };
}

/** perfoms a callback as an async call */
export async function asyncCallback(action, ...args) {
	return new Promise((resolve, reject) => {
		action(...args, (err, ...res) => {
			if (err) reject(err);
			else resolve(...res);
		});
	});
}

/** generates a key from a file name or path */
export function fileToKey(file) {
	return _.snakeCase(path.basename(file, path.extname(file)))
}

/** waits a specified time */
export async function timeout(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}