#! /usr/bin/env node
const path = require('path');
const { program } = require('commander');
const { serve } = require('../dist/server');
const resources = path.resolve(__dirname, '../client');

// attempt to run
try {
	program
		.option('-i, --input <dir>', 'Asset resource directory', './resources')
		.option('-o, --output <dir>', 'The compiled output directory', './dist')
		.option('-v, --overrides <path>', 'JSON resource of overrides for configurations', '')
		.option('-d, --dev', 'Dev mode')
		.option('-p, --port <number>', 'Port number to run the composer preview site', 9999)
		.parse(process.argv);

	// wants help, or doesn't have args
	if (!(program.input && program.output)) {
		program.outputHelp();
	}
	else {
		const input = path.resolve(program.input);
		const output = path.resolve(program.output);
		const overrides = path.resolve(program.overrides);
		const port = 0 | program.port;
		const dev = !!program.dev;
		serve({ input, output, overrides, port, dev, resources });
	}
}
catch (ex) {
	program.outputHelp();	
}