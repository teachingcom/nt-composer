import express from 'express';
import path from 'path';
import chokidir from 'chokidar';
import Bundler from 'parcel-bundler';
import { compile } from '../compile';
import Server from 'simple-websocket/server';

// shared config
let CONFIG;
let ROOT;

// web socket communication
let ws;
let connections = [ ];

// kicks off the process
export async function serve(config) {
	CONFIG = config;

	// get the root of the nt-composer module
	// ???: search for package.json
	const [ entry, script ] = process.argv;
	ROOT = path.dirname(script);

	// if this was called as a binary, we need to resolve to
	// the root of the node module
	// NOTE: I don't normally do this, so I don't know the
	// best practices for something like this
	if (/\.bin$/.test(ROOT)) {
		ROOT = path.dirname(ROOT);
		ROOT = path.resolve(ROOT, 'nt-composer');
	}

	// set some defaults
	if (isNaN(CONFIG.port) || CONFIG.port < 1000) CONFIG.port = 9999;

	// check for the development bundler
	let bundler;

	// create the bundler which is just serving
	// the index html file
	if (config.dev) {
		console.log('[mode] using dev mode');
		bundler = new Bundler(`${ROOT}/preview/index.html`, {
			outDir: './.preview/client',
			sourceMaps: true,
			cache: false
		});
	}

	// create the app
	const app = express();

	// communicate for websockets
	configureWebSockets();

	// use pre-compiled track/animator
	if (!config.dev) {
		app.use(express.static(`${ROOT}/dist/client`));
	}

	// share the root to allow access to node_modules
	// primarily to allow access to source maps
	app.use(express.static(`${ROOT}/node_modules`));

	// access to non-compiled assets
	app.use(express.static(`${ROOT}/public`));

	// access to compiled assets and spritesheets
	app.use(express.static(CONFIG.output));

	// wait for changes
	chokidir.watch(CONFIG.input)
		.on('add', queueCompileAssets)
		.on('change', queueCompileAssets)
		.on('unlink', queueCompileAssets);

	// inject parcel bundler
	if (config.dev) {
		app.use(bundler.middleware());
	}

	// waits for assets to compile
	await waitForAssets();

	// start listening
	console.log(`NT Previewer now ready at http://localhost:${CONFIG.port}`);
	app.listen(CONFIG.port);
	
}

// prepares a socket handler to communicate when
// assets are updated
function configureWebSockets() {

	// create the server
	ws = new Server({ port: CONFIG.port + 1 });

	// wait for connections
	ws.on('connection', socket => {

		// cleanup
		socket.on('end', () => {
			const index = connections.indexOf(socket);
			connections.splice(index, 1);
		});

		// add to active connections
		connections.push(socket);
	});
}

// queues waiting for assets to finish compiling
let waitingForAssets;
function waitForAssets() {
	return new Promise(resolve => waitingForAssets = resolve);
}

// watch for changes
let pendingRefresh;
function queueCompileAssets() {
	clearTimeout(pendingRefresh);
	pendingRefresh = setTimeout(compileAssets, 1000);
}

// send a message to active connections
function notifyConnections(message) {
	for (const socket of connections) {
		try { socket.send(message); }
		catch (ex) { }
	}
}

// kicks off the compile process
async function compileAssets() {

	console.log('\n\nCompiling assets\n');
	notifyConnections('pending');

	// wait for the compile
	try {
		await compile(CONFIG.input, CONFIG.output);
		notifyConnections('refresh');
		console.log('\nAssets compiled\n\n');
	}
	catch (ex) {
		notifyConnections('error');
		console.log('\nAssets compile error\n\n');
		console.log(ex);
	}
	
	// ready to show
	if (waitingForAssets) {
		waitingForAssets();
	}
}
