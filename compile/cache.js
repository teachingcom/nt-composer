import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import hash from 'object-hash';
import { getDirectoryContents } from './utils.js';

// tracks all cached directories and files
let cache;
let location;

/** prepares the cache tracking */
export async function init(root) {
	location = path.resolve(`${root}/.cache`);

	// read the file, if possible
	try {
		const data = await fs.readFile(location);
		cache = JSON.parse(data.toString()) || { };
	}
	// if fails, just create a new cache
	catch (ex) {
		console.error('failed to load cache', ex);
		cache = { };
	}
}

/** saves the current cache state */
export async function write() {
	const data = JSON.stringify(cache);
	fs.writeFile(location, data);
}

/** compares two hash values to see if it's valid */
export function isCurrent(hash) {
	const existing = cache[hash.path];
	return existing && hash.images == existing.images && hash.markup === existing.markup;
}

/** compares two hash values to see if it's invalid */
export function isExpired(hash) {
	return !isCurrent(hash);
}

/** saves a hash value to the cache */
export function set(hash) {
	cache[hash.path] = hash;
}

/** calculates the hash for a directory */
export async function calculateDirectoryHash(relativeTo) {
	const toKey = item => `${item.source}:${item.lastModified}`;
	const content = await getDirectoryContents(relativeTo);
	const markup = _.map(content.markup, toKey);
	const images = _.map(content.images, toKey);

	// return the hash
	return {
		path: hash(relativeTo),
		markup: hash(markup),
		images: hash(images)
	};
}

