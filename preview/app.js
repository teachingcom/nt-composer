import editor from './editor';
import Stats from 'stats.js';
import Socket from 'simple-websocket';

// view types
import setupAsTrack from './as-track';
import setupAsCompose from './as-compose';
import toast from './toast';

// reload page content
async function init() {

	// listen for changes from a websocket --
	// any data coming down is enough to know to refresh
	const { hostname, port } = window.location;
	const socket = new Socket(`ws://${hostname}:${1 + (0 | port)}`);
	socket.on('data', data => {
		const message = getMessage(data);
		
		// server started compiling assets
		if (message === 'pending')
			toast('success', 'Changes detected. Waiting for server update');

		// server finished refreshing
		else if (message === 'refresh') {
			toast('success', 'Reloading page after asset update');
			window.location.reload();
		}
		// there was an error
		else if (message === 'error') {
			toast('error', 'Error compiling assets. Check terminal for more info');
		}
	});

	// prepare the view
	const canvas = document.createElement('canvas'); 
	document.querySelector('#view').appendChild(canvas);
	
	// // add FPS tracking
	const stats = new Stats();
	stats.dom.id = 'fps-display'
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb
	document.body.appendChild(stats.dom);

	// view updating functions
	let update = () => { };
	let resize = () => { };
	let activateNitro = () => { };

	// setup edit handling
	editor.init(reload);

	// handles loading a view
	let requiresReload;
	async function reload(data) {
		if (requiresReload) window.location.reload();
		requiresReload = true;
		
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
		switch (event.key) {
			case 'n': activateNitro()
			default: console.warn('unhandled key', event.key)
		}
	});

	// setInterval(() => update(), 16);

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

// reads a socket message
function getMessage(bytes) {
	const chars = [ ];
	for (const byte of bytes || [ ])
		chars.push(String.fromCharCode(byte));
	return chars.join('');
}

// initialize
window.addEventListener('load', init);

// for reload testing
window.INIT_TRACK = init;