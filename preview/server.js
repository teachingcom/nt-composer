import express from 'express';
import path from 'path';

import Bundler from 'parcel-bundler';

// paths
const ROOT = path.resolve(path.dirname(''));
const RESOURCES = path.resolve(`${ROOT}/dist`);
const ENTRY = path.resolve(`${ROOT}/preview/index.html`);

// create the bundler
const bundler = new Bundler(ENTRY, {
	outDir: './.dist'
});

// create the app
const app = express();

// middlware
app.use(express.static(RESOURCES));
app.use(bundler.middleware());

// start listening
app.listen(9999);