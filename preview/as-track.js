import _ from 'lodash';
import { Track, FOREGROUND_SCALE } from 'nt-track';
import toast from "./toast";
import manifest from '../dist/export.json';


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
		skipIntro: false,
		skipCountdown: false,
		fastRace: false,
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

// activates a simulated race
class RaceSimulator {

	constructor(track, options) {
		this.track = track;
		this.options = options;

		// handle events
		track.on('ready', () => this.ready());

		// starting the race animation
		track.on('start', this.startRace);

		// proxy a few things
		this.animator = track.animator;
		this.render = () => track.render();
		this.resize = () => track.resize();
		this.setTrack = (...args) => track.setTrack(...args);
		this.activateNitro = (...args) => track.activateNitro(...args);
	}

	// tracking registered players
	playerCount = 0

	// determine what to do
	ready = () => {
		const { options } = this;
		const { skipRace } = options;
		if (skipRace) this.immediateFinish();
		else this.simulateRace();
	};

	// performs a simulated race
	simulateRace = () => {
		const { options } = this;
		const { skipCountdown } = options;
		if (skipCountdown) this.startRace();
		else this.track.startCountdown();
	}

	// immediately jumps to the finish animation
	immediateFinish = () => {
		const { track } = this;
		const finished = _.shuffle(track.players);

		// start the 
		let playerIndex = Number.MAX_SAFE_INTEGER;
		_.each(finished, (player, place) => {
			const isPlayer = player.id === track.options.activePlayerId;
			if (isPlayer) playerIndex = place;

			// late player, finish with a delay
			if (place > playerIndex) {
				const delay = (place - playerIndex) * 1500;
				setTimeout(() => track.finishRace(player, place), delay);
			}
			// player or already finished player
			else {
				track.finishRace(player, place, !isPlayer);
			}
		});
	}

	// capture player instance requests
	addPlayer = data => {
		const { track, options } = this;
		const { skipIntro } = options;
		const delay = skipIntro ? 0 : 0 | ((this.playerCount++ * 1000) + Math.random() * 1000);
		setTimeout(() => track.addPlayer(data, skipIntro), delay);
	}

	// handles the race activation
	startRace = () => {
		const speeds = [ 5, 4.5, 4, 3.5, 3 ];
		const { track, options } = this;
		const { players } = track;
		const { fastRace } = options;
		
		// track race state
		const state = { };
		
		// setup each player
		for (let i = 0; i < players.length; i++) {

			// grab a speed to use
			const index = 0 | (Math.random() * speeds.length);
			const speed = speeds[index];
			speeds.splice(index, 1);

			// save the player state
			state[`player_${i}`] = {
				speed,
				progress: fastRace ? 85 : 0,
				usedNitro: false
			};
		}
		
		// begins the race
		track.startRace();

		// bump each player forward
		setInterval(() => {
			let didNitro = false;

			// nudge forward
			for (const id in state) {
				const player = state[id];
				player.progress += player.speed;

				// check for nitros
				if (!didNitro
					&& !fastRace
					&& !player.usedNitro
					&& Math.random() < (player.progress / 100)) {
					didNitro = player.usedNitro = true;
					track.activateNitro(id);
				}

				// update progress
				track.setProgress(id, player.progress);
			}

		}, 1000);


	}


	// constructor(options) {
	// 	this.options = options;
	// }

	// playerCount = 0;
	// waitingForPlayers = 0;

	// // start the process
	// setTrack(track) {
	// 	this.track = track;
	// 	track.on('ready', track.startCountDown);
	// 	track.on('start', this.start);
	// 	track.on('finish', track.onFinish);
	// }

	// // include a player racer
	// addPlayer = data => {
	// 	const { speedup = 1 } = this.options;
	// 	this.playerCount++;
	// 	const timeout = this.options.simulateEntry
	// 		? 0 | ((this.playerCount * 1000) + (Math.random() * 1000))
	// 		: 0;

	// 	// wait depending
	// 	setTimeout(async () => {
	// 		await this.track.addPlayer(data);
	// 	}, 0 | (timeout / speedup));
	// }

	// // start the race
	// start = () => {
	// 	const { track, options } = this;
	// 	const { raceProgressRate = 4, simulateFinish = false, speedup = 1 } = options;
	// 	const startProgress = simulateFinish ? 99 : 1;

	// 	// setup progress
	// 	const race = { };
	// 	for (const player of track.players) {
	// 		const isWinner = player.id === options.winnerId;
	// 		const speedBonus = isWinner ? raceProgressRate : 0;
	// 		const speed = 5 + (0 | (Math.random() * raceProgressRate));
	// 		const rate = speed + speedBonus;
	// 		race[player.id] = {
	// 			at: Math.max(0, startProgress - rate * 2),
	// 			per: rate
	// 		};
	// 	}

	// 	// per interval, set progress
	// 	setInterval(() => {
	// 		for (const player of track.players) {
	// 			const progress = race[player.id];
	// 			progress.at += progress.per;

	// 			// check for random nitro
	// 			if (!progress.nitroUsed && Math.random() < (progress.at / 100)) {
	// 				track.activateNitro(player.id);
	// 				progress.nitroUsed = true;
	// 			}

	// 			// update each player
	// 			track.setProgress(player.id, progress.at);
	// 		}

	// 	}, 0 | (1000 / speedup));
	// }


}

