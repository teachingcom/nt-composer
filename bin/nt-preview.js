#! /usr/bin/env node
const path = require('path');
const { program } = require('commander');
const { serve } = require('../dist/server');

// attempt to run
try {
	program
		.option('-i, --input <dir>', 'Asset resource directory', './resources')
		.option('-o, --output <dir>', 'The compiled output directory', './dist')
		.option('-p, --port <number>', 'Port number to run the composer preview site', 9999)
		.parse(process.argv);

	// wants help, or doesn't have args
	if (!(program.input && program.output)) {
		program.outputHelp();
	}
	else {
		const input = path.resolve(program.input);
		const output = path.resolve(program.output);
		const port = 0 | program.port;
		serve({ input, output, port });
	}
}
catch (ex) {
	program.outputHelp();	
}