import toast from './toast';

// the manifest data
let manifest;

// request the asset manifest
export async function loadManifest() {
	return new Promise((resolve, reject) => {

		// make the request
		const xhr = new XMLHttpRequest();

		// load when ready
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				manifest = JSON.parse(this.responseText);
				window.NT = { manifest };
				resolve();
			}
		};

		// notify of errors
		xhr.onerror = () => {
			toast('error', `Failed to load resource files!`);
			reject();
		};
		
		xhr.open('GET', '/manifest.json');
		xhr.send();
	});
}

// returns the current manifest, if any
export default function getManifest() {
	return manifest;
};