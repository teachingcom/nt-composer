import fs from 'fs-extra';
import { INPUT_DIR } from '../paths.js';
import xml2js from 'xml2js';
import omgsvg from 'omgsvg/omgsvg.js';
import Bezier from 'bezier-js';


/** uses the race-progress.svg file to calculate  */
export async function compileProgressPath() {
	const { width, height, offsetX, offsetY, svg } = await extractFile();
	const { points, distance } = extractPoints(svg);
	return createProgress(points, distance, offsetY, height);
}


// reads in the svg data
async function extractFile() {
	const source = await fs.readFile(`${INPUT_DIR}/race-progress.svg`);
	const markup = source.toString();
	const doc = await xml2js.parseStringPromise(markup);

	// search for content
	let rect;
	let path;
	for (const id in doc.svg) {
		if (id === 'rect') rect = doc.svg[id];
		else if (id === 'path') path = doc.svg[id];
	}

	// gather data
	// library has arrays for each type and dollar sign
	// to access attributes
	const offsetX = 0 | rect[0].$.x;
	const offsetY = 0 | rect[0].$.y;
	const width = 0 | rect[0].$.width;
	const height = 0 | rect[0].$.height;
	const svg = path[0].$.d;

	return { width, height, offsetX, offsetY, svg };
}


// reads the svg path data points
function extractPoints(svg) {

	// overall path definition
	const points = [ ];

	// parse this path
	let distance = 0;
	const parsed = new omgsvg.SVGPathParser(svg);
	while (parsed.seek_next_cmd()) {
		const args = parsed.parse_cur_args();
		const index = points.length;

		// this is the first point - nothing
		// needs to be done other than add it
		if (index === 0) {
			const [ x, y ] = args;
			points.push({ isStart: true, points: args, x, y, dist: 0 });
		}
		// this is a line - get the total distance
		else if (args.length === 2) {
			const previous = points[index - 1];
			const [ x, y ] = args;
			const dist = Math.hypot(previous.x - x, previous.y - y);

			// update the total length
			distance += dist;

			// replace this command
			points.push({ isLine: true, points: args, x, y, dist });
		}
		// this uses 6 command points and is a bezier curve
		else if (args.length === 6) {
			const previous = points[index - 1];
			const [ cx1, cy1, cx2, cy2, x, y ] = args;
			const curve = new Bezier(previous.x, previous.y, cx1, cy1, cx2, cy2, x, y);
			const dist = curve.length();

			// update the total length
			// end = start + dist; 
			distance += dist;

			// replace this command
			points.push({ isBezier: true, points: args, x, y, dist, curve });
		}
		// no quadratic curves
		else if (args.length === 4) {
			throw 'Quadradic curves are not supported';
		}
	}

	return { points, distance };
}


// generate the progress from the svg path
function createProgress(points, distance, offsetY, height) {
	const progress = [ ];

	// normalizes each y-axis point as a percentage, so the lower
	// the y value is actually more progress
	const normalizePoint = y => {
		// round the number to two decimal places
		return (0 | (1 - ((y - offsetY) / height)) * 100) / 100;
	};

	// with the known length, calculate the points along each
	// path to account for their space. This also 
	let index = 1;
	let max = 0;
	const scale = 1;
	const samples = 100 * scale;

	// calculate the preferred number of samples for the progress
	while (max < samples) {
		const current = points[index];
		const segment = Math.round(samples * (current.dist / distance));

		// get the percentage distance
		max += segment;

		// sample the required points for a curve
		// and save all y/axis values
		if (current.isBezier) {
			const lut = current.curve.getLUT(segment);
			for (const point of lut) {
				const t = normalizePoint(point.y)
				progress.push(t);
			}
		}
		// for a line, just interpolate the y position
		else if (current.isLine) {
			const previous = points[index - 1];
			for (let i = 0; i < segment; i++) {
				const y = previous.y + ((current.y - previous.y) * (i / segment));
				const t = normalizePoint(y);
				progress.push(t);
			}
		}
		// shouldn't happen, but if the point type
		// is unexpected, complain about it
		else {
			throw 'Unexpected point type in path'
		}

		// continue forward
		index++;
	}

	return progress;
}