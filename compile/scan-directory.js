import path from 'path';
import fs from 'fs-extra';

/** handles checking a directory for content */
export default async function scanDirectory(source, options, action) {

	// doesn't exist yet
	const exists = await fs.exists(source);
	if (!exists) return;

	// gather all sub folders
	const dirs = await fs.readdir(source);
	for (const dir of dirs) {

		// make sure it's not a hidden file and
		// is actually a directory
		const location = path.resolve(`${source}/${dir}`);
		const stat = await fs.stat(location);
		const isHidden = dir[0] === '.';
		const isDirectory = stat.isDirectory();
		const allowType = isDirectory || (!isDirectory && options.allowFiles);
		const allowHidden = !isHidden || (isHidden && options.allowHidden);

		// continue with this resource
		if (allowType && allowHidden) 
			await action(dir, location);
	}

}