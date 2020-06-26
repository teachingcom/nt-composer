import path from 'path';
import paths from './paths.js';
import generateResource from './generate-resource.js';
import scanDirectory from './scan-directory.js';

/** generates a resource from each item in a directory */
export default async function generateResourcesFromDirectory(root, node, id, options) {
	const { INPUT_DIR } = paths;
	const source = path.resolve(`${INPUT_DIR}/${id}`);
	
	// if the node is missing, create it
	if (!node) {
		node = { };
		root[id] = node;
	}

	// process all diles in a directory
	await scanDirectory(source, { }, async dir => {
		await generateResource(root, node, dir, { nodeId: dir, subdir: id });
	});
}