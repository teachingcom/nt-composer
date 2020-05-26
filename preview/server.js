import express from 'express';
import path from 'path';
const ROOT = path.resolve(path.dirname(''));

// parcel bundle helper
import Bundler from 'parcel-bundler';

// create the bundler which is just serving
// the index html file
const bundler = new Bundler(`${ROOT}/preview/index.html`, {
	outDir: './.dist'
});

// create the app
const app = express();

// share the root to allow access to node_modules
// primarily to allow access to source maps
app.use(express.static(`${ROOT}/`));
app.use(express.static(`${ROOT}/node_modules`));

// access to non-compiled assets
app.use(express.static(`${ROOT}/public`));

// access to compiled assets and spritesheets
app.use(express.static(`${ROOT}/dist`));

// access to sample resources such as legacy cars, etc
app.use(express.static(`${ROOT}/preview/legacy`));

// inject parcel bundler
app.use(bundler.middleware());

// start listening
app.listen(9999);