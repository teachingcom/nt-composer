import express from 'express';
import path from 'path';
import Bundler from 'parcel-bundler';
import compile from '../compile';

// get the subdir
const [exec, script, inputDir, outputDir, PORT = 9999] = process.argv;
const ENTRY = path.dirname(script);
const ROOT = path.dirname(ENTRY);

const REQUESTED = path.dirname(script);
const INPUT = path.resolve(REQUESTED, inputDir);
const OUTPUT = path.resolve(REQUESTED, outputDir);

// check for the development bundler
let requiresBundler;
let bundler;

// create the bundler which is just serving
// the index html file
if (requiresBundler) {
	bundler = new Bundler(`${ROOT}/preview/index.html`, {
		outDir: './.dist',
		sourceMaps: true,
		cache: false
	});
}

// create the app
const app = express();

// perform a first time compile
compile(inputDir, outputDir);

// share the root to allow access to node_modules
// primarily to allow access to source maps
app.use(express.static(`${ROOT}/dist/client`));
app.use(express.static(`${ROOT}/node_modules`));

// access to non-compiled assets
app.use(express.static(`${ROOT}/public`));

// access to compiled assets and spritesheets
// app.use(express.static(`${ROOT}/dist`));
app.use(express.static(OUTPUT));

// compile on startup?

// inject parcel bundler
if (requiresBundler) {
	app.use(bundler.middleware());
}

// start listening
app.listen(PORT);