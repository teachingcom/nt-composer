#! /usr/bin/env node
const path = require('path');
const { program } = require('commander');
const { compile } = require('../dist/compile');

program
	.option('-i, --input <dir>', 'Asset resource directory')
	.option('-o, --output <dir>', 'The compiled output directory')
	.parse(process.argv);
	
if (!(program.input && program.output)) {
	program.outputHelp();
}
else {
	const input = path.resolve(program.input);
	const output = path.resolve(program.output);
	compile(input, output);
}
