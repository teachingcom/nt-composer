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
	const manifest = await getManifest();
	
	const container = target.parentNode;
	container.innerHTML = '';

	// create the track instance
	let track = new Track();
	await track.init({
		container,
		manifest,
		baseUrl: `${window.location.origin}/`,
		sfx: !data.silent,
		music: false,
		transparent: true
	});

	// for local testing purposes
	if (window.ACTIVE_TRACK) {
		track.fadeIn();	
	}

	// save the track instance for reload testing
	window.ACTIVE_TRACK = track;

	// create a simulator, if using it
	track = new RaceSimulator(track, {
		noRace: !!data.noRace,
		skipIntro: !!data.skipIntro || !!data.midRace,
		midRace: !!data.midRace,
		skipCountdown: !!data.skipCountdown || !!data.midRace,
		forceNitros: !!data.forceNitros,
		fastRace: !!data.fastRace,
		slowRace: !!data.slowRace,
		skipRace: !!data.skipRace,
		loseRace: !!data.loseRace,
		winRace: !!data.winRace,
	});

	// started in the middle
	let racers;
	if (data.midRace) {
		const startPercent = Math.random() * 0.75;
		racers = data.cars.map((car, i) => ({
			userID: `player_${i}`,
			position: i === 0 ? startPercent : (startPercent + ((Math.random() - 0.5) * 0.1)),
			disqualified: Math.random() > 0.95
		}))
	}

	// load the track instance
	try {
		const parts = path.split(/\//g);
		const [__, trackId, variantId] = parts;
		const src = track.animator.lookup(path);

		// determine the seed to use
		let seed = src?.seed || data.seed || 'nitro';

		// just in case testing random tracks
		if (/random/i.test(trackId)) {
			seed = Math.random().toString('16');
		}
		
		// initalize these values
		await track.setTrack({
			seed,
			trackId,
			variantId,
			spectator: data.isSpectator,
			raceInProgress: data.midRace,
			racers
		});

		// check for a background color
		// normally for extracting sprites
		if (data.bg) {
			document.documentElement.style.backgroundColor = data.bg;

			// marvelous
			track.track.track.overlay.visible = false;
			track.track.track.ground.visible = false;
			setInterval(track.track.removeShadows, 1000);
		}
	}
	// failed to create
	catch (ex) {
		toast('error', `Unable to create track ${path}. Check the console for errors`);
		throw ex;
	}

	// include each car, as needed
	const pattern = LANE_PATTERN[Math.min(4, data.cars.length - 1)]
	for (let i = 0; i < data.cars.length; i++) {
		const car = data.cars[i];

		// check for admin flag
		// TODO: should this go somewhere else?
		let isAdmin
		if (/admin/i.test(car.mods.card)) {
			isAdmin = true
			car.mods.card = car.mods.card
				.replace(/admin/, '')
				.replace(/ /g, '');
		}


		track.addPlayer({
			id: `player_${i}`,
			isPlayer: i === 0,
			type: car.type,
			lane: pattern[i % pattern.length],
			hue: car.hue,
			mods: car.mods,
			isAnimated: true,
			isFriend: Math.random() < 0.5,
			isGold: Math.random() < 0.5,
			isAdmin,
			playerRank: 0 | Math.random() < 2500,
			playerName: 'Guest Racer',
			playerTeam: 'NT'
		});
	}

	// when testing nitros, force activations on an interval
	if (data.forceNitros && !window.NITRO_INTERVAL) {

		const nitroDelay = (0 | localStorage.getItem('nitro-delay')) || 5000
		const triggerNitro = () => {
			track.track.activateNitro(`player_${0}`);
			setTimeout(triggerNitro, nitroDelay)
		};

		// kick off nitros
		setTimeout(triggerNitro, 2000);
	}

	// handle track updates
	const update = () => track.render();
	const resize = () => track.resize();

	// handling nitro effects
	const activateNitro = () => {
		const index = 0 | (Math.random() * data.cars.length);
		track.track.activateNitro(`player_${index}`);
	};

	return { update, resize, activateNitro };

}


