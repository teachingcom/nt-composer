import path from 'path';
const [ exec, script, INPUT_DIR, OUTPUT_DIR ] = (process.argv || [ ]);

// get the root path
const paths = { 
	OUTPUT_DIR: path.resolve(INPUT_DIR || ''),
	INPUT_DIR: path.resolve(OUTPUT_DIR || ''),
};

export function replacePaths(inputDir, outputDir) {
	paths.INPUT_DIR = inputDir;
	paths.OUTPUT_DIR = outputDir;
}

export default paths;