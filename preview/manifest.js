import toast from './toast';

// the manifest data
let manifest;

// request the asset manifest
export async function loadJSON(path) {
	return new Promise((resolve, reject) => {

		// make the request
		const xhr = new XMLHttpRequest();

		// load when ready
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				const data = JSON.parse(this.responseText);
				resolve(data);
			}
		};

		// notify of errors
		xhr.onerror = () => {
			toast('error', `Failed to load resource files!`);
			reject();
		};
		
		xhr.open('GET', path);
		xhr.send();
	});
}

// returns the current manifest, if any
export default async function getManifest() {
	const manifest = await loadJSON('/manifest.json');
	const mapping = await loadJSON('/mapping.json');

	// replace all mappings as required
	for (const category in mapping) {
		for (const hash in mapping[category]) {
			const key = mapping[category][hash]
			const data = manifest.spritesheets[hash]

			// ensure the object is available
			manifest[category] = manifest[category] || { }

			// map the object
			manifest.spritesheets[`${category}/${key}`] = data
		}
	}

	window.NT = { manifest };
	return manifest;
};