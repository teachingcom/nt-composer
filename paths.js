import path from 'path';

// get the root path
// __dirname does not exist anymore
export const ROOT_DIR = path.resolve(path.dirname(''));
export const OUTPUT_DIR = path.resolve(`${ROOT_DIR}/dist`);
export const INPUT_DIR = path.resolve(`${ROOT_DIR}/resources`);