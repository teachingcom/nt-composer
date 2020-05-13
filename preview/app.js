
import { Animator } from 'nt-animator';
import { Composer } from 'nt-track';

import toast from './toast';
import editor from './editor';

// import * as PIXI from 'pixi.js';
import manifest from '../dist/export.json';
import setupAsTrack from './as-track';

// sharing for debugging help
window.MANIFEST = manifest;


// reload page content
async function init() {
	const canvas = document.querySelector('#view > canvas');

	// update function called for each frame
	let update = () => { };
	let resize = () => { };

	// setup edit handling
	editor.init(reload);

	// handles loading a view
	async function reload(data) {

		// look up the track to use
		if (data.tracks.length > 0) {
			const setup = await setupAsTrack(canvas, data);
			update = setup.update;
			resize = setup.resize;
		}
		// without a track, just throw everthing
		// onto the view and render as normal
		else {
			// always create a track
			const view = new Composer();

			// try and initialize the request
			try {
				await view.init({
					baseHeight: 800,
					target: canvas,
					manifest,
					baseUrl: '/'
				});
	
				// compose each item
				const text = editor.getText();
				view.compose(text);
			}
			// handle failing to load
			catch (ex) {
				toast('error', 'Unable to compose request. Check the console for errors');
				throw ex;
			}

			// handle resizing
			update = () => view.render();
			resize = () => view.resize();
		}
			

	}
	
	
	// handle resize events
	window.addEventListener('resize', () => resize());


	// handle track rendering
	function refresh() {
		update();
		requestAnimationFrame(refresh);
	}

	// start updating
	refresh();
}

// initialize
window.addEventListener('load', init);