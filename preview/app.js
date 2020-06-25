import editor from './editor';
import Stats from 'stats.js';
import { loadManifest } from './manifest';

// view types
import setupAsTrack from './as-track';
import setupAsCompose from './as-compose';

// reload page content
async function init() {

	// requires the player manifest
	await loadManifest();

	// prepare the view
	const canvas = document.querySelector('#view > canvas');
	const stats = new Stats();
	
	// add FPS tracking
	// 0: fps, 1: ms, 2: mb
	stats.showPanel(0);
	document.body.appendChild(stats.dom);

	// view updating functions
	let update = () => { };
	let resize = () => { };
	let activateNitro = () => { };

	// setup edit handling
	editor.init(reload);

	// handles loading a view
	async function reload(data) {
		
		// determine the view type
		const handler = data.tracks.length > 0 ? setupAsTrack
			: setupAsCompose;

		// create the view
		const setup = await handler(canvas, data);
		update = setup.update;
		resize = setup.resize;
		activateNitro = setup.activateNitro;
	}
	
	
	// handle resize events
	window.addEventListener('resize', () => resize());

	// special events
	window.addEventListener('keyup', event => {
		if (document.activeElement?.id === 'paths') return;
		switch (event.which) {
			case 84: activateNitro()
		}
	});


	// handle track rendering
	function refresh() {
		stats.begin();
		update();
		stats.end();
		requestAnimationFrame(refresh);
	}

	// start updating
	refresh();
}

// initialize
window.addEventListener('load', init);