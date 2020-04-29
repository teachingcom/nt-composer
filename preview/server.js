import Bundler from 'parcel-bundler';
import express from 'express';
import path from 'path';

const app = express();

const ROOT = path.resolve(path.dirname(''));
const ENTRY = path.resolve(`${ROOT}/preview/index.html`);
console.log(ENTRY);
// const file = 'index.html'; // Pass an absolute path to the entrypoint here
// const options = {}; // See options section of api docs, for the possibilities

// // Initialize a new bundler using a file and options
// const bundler = new Bundler(file, options);

// // Let express use the bundler middleware, this will let Parcel handle every request over your express server
// app.use(bundler.middleware());

// // Listen on port 8080
// app.listen(9999);