#! /usr/bin/env node
// console.log('goooo')
const shell = require("shelljs");
const { program } = require('commander');
const path = require("path")

program
	.option('-i, --input <dir>', 'Asset resource directory')
	.option('-o, --output <dir>', 'The compiled output directory')
	.option('-p', '--port <number>', 'Port number to run the composer preview site')
	.parse(process.argv);

	
	if (!(program.input && program.output)) {
		program.outputHelp();
	}
	else {
		
	
	const command = `node ./node_modules/nt-composer/dist/server.js "${program.input}" "${program.output}" ${program.port || 999}`;
	console.log('callign command', command);
	shell.exec(command);
	
}
// process.env.PATH += (path.delimiter + path.join(process.cwd(), 'node_modules', '.bin'));
// shell.exec("concurrently --kill-others \"node ./node_modules/nt-composer/dist/server.js 9000 ./resources\"");