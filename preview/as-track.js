import _ from 'lodash';
import { Track } from 'nt-track';
import toast from "./toast";
import manifest from './manifest';
import { RaceSimulator } from './simulator';


// there's probably a fancy math trick
// to do this but I don't know it
const LANE_PATTERN = [ [2], [1,3], [2,0,4], [0,1,3,4], [0,1,2,3,4] ];

// create cars and a track
export default async function setupAsTrack(target, data) {
	const path = data.tracks.pop();

	// create the track instance
	let track = new Track();
	await track.init({
		target,
		manifest,
		baseUrl: '/',
		staticUrl: '/cars',
		activePlayerId: `player_0`,
		sfx: false,
		music: false
	});

	// create a simulator, if using it
	track = new RaceSimulator(track, {
		silent: true,
		// delayStart: 15000,
		noRace: false,
		skipIntro: false,
		skipCountdown: false,
		fastRace: true,
		slowRace: false,
		skipRace: false,
	});

	// load the track instance
	try {
		const parts = path.split(/\//g);
		const [__, trackId, variantId] = parts;
		const src = track.animator.lookup(path);
		const seed = src.seed || data.seed || 'nitro';
		
		// initalize these values
		await track.setTrack({ seed, trackId, variantId });
	}
	// failed to create
	catch (ex) {
		toast('error', `Unable to create track ${path}. Check the console for errors`);
		throw ex;
	}

	// include each car, as needed
	for (let i = 0; i < data.cars.length; i++) {
		const car = data.cars[i];
		track.addPlayer({
			id: `player_${i}`,
			type: car.type,
			lane: LANE_PATTERN[data.cars.length - 1][i],
			hue: car.hue,
			mods: car.mods
		});
	}

	// handle track updates
	const update = () => track.render();
	const resize = () => track.resize();

	// handling nitro effects
	const activateNitro = () => {
		const index = 0 | (Math.random() * track.players.length);
		track.activateNitro(track.players[index].id);
	};

	return { update, resize, activateNitro };

}


