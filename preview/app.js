import editor from './editor';
import manifest from '../dist/export.json';
import Stats from 'stats.js';

// view types
import setupAsTrack from './as-track';
import setupAsCompose from './as-compose';

// sharing for debugging help
window.MANIFEST = manifest;

// reload page content
async function init() {
	const canvas = document.querySelector('#view > canvas');
	const stats = new Stats();
	
	// add FPS tracking
	// 0: fps, 1: ms, 2: mb
	stats.showPanel(0);
	document.body.appendChild(stats.dom);

	// view updating functions
	let update = () => { };
	let resize = () => { };

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
	}
	
	
	// handle resize events
	window.addEventListener('resize', () => resize());

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