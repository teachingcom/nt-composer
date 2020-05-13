import { Track } from 'nt-track';
import toast from "./toast";
import manifest from '../dist/export.json';


// there's probably a fancy math trick
// to do this but I don't know it
const LANE_PATTERN = [ [2], [1,3], [0,2,4], [0,1,2,4], [0,1,2,3,4] ];

// create cars and a track
export default async function setupAsTrack(target, data) {
	const path = data.tracks.pop();

	// create the track instance
	const track = new Track();
	await track.init({
		target,
		manifest,
		baseUrl: '/',
		staticUrl: '/cars'
	});

	// load the track instance
	try {
		const parts = path.split(/\//g);
		const [__, trackId, variantId] = parts;
		const src = track.animator.lookup(path);
		const seed = src.seed || data.seed || `${+new Date}`;
		
		// initalize these values
		await track.setTrack({ seed, trackId, variantId })
	}
	// failed to create
	catch (ex) {
		toast('error', `Unable to create track ${path}. Check the console for errors`);
		throw ex;
	}

	// include each car, as needed
	for (let i = 0; i < data.cars.length; i++) {
		const car = data.cars[i];
		await track.addPlayer({
			type: car.type,
			lane: LANE_PATTERN[data.cars.length - 1][i],
			hue: car.hue,
			mods: car.loot
		});
	}

	// replace functions to allow 
	const update = () => track.render();
	const resize = () => track.resize();
	return { update, resize };

}