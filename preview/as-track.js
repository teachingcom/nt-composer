import _ from 'lodash';
import { Track } from 'nt-track';
import toast from "./toast";
import getManifest from './manifest';
import { RaceSimulator } from './simulator';


// there's probably a fancy math trick
// to do this but I don't know it
const LANE_PATTERN = [ [2], [1,3], [2,0,4], [0,1,3,4], [0,1,2,3,4] ];

// create cars and a track
export default async function setupAsTrack(target, data) {
	const path = data.tracks.pop();
	const manifest = getManifest();
	
	const container = target.parentNode;
	container.innerHTML = '';

	// create the track instance
	let track = new Track();
	await track.init({
		container,
		manifest,
		baseUrl: `${window.location.origin}/`,
		sfx: !data.silent,
		music: false
	});

	// create a simulator, if using it
	track = new RaceSimulator(track, {
		noRace: !!data.noRace,
		skipIntro: !!data.skipIntro,
		skipCountdown: !!data.skipCountdown,
		fastRace: !!data.fastRace,
		slowRace: !!data.slowRace,
		skipRace: !!data.skipRace,
		loseRace: !!data.loseRace,
		winRace: !!data.winRace,
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
			isPlayer: i === 0,
			type: car.type,
			lane: LANE_PATTERN[data.cars.length - 1][i],
			hue: car.hue,
			mods: car.mods,
			isAnimated: true,
			isFriend: Math.random() < 0.5,
			isGold: Math.random() < 0.5,
			playerRank: 0 | Math.random() < 2500,
			playerName: 'Guest Racer',
			playerTeam: 'NT'
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


