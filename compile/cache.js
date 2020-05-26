import fs from 'fs-extra';

/** the previous version of the file */
export const data = { };

// tries to load the previous document, if any
export async function load(path) {
	try {
		const content = await fs.readFile(path);
		const parsed = JSON.parse(content.toString());
		Object.assign(data, parsed);
	}
	// wasn't able to restore the file
	catch (ex) { }
}
