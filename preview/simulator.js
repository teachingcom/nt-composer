import * as _ from 'lodash';

// activates a simulated race
export class RaceSimulator {

	constructor(track, options) {
		this.track = track;
		this.options = options;

		// handle events
		track.on('ready', () => this.ready());

		// starting the race animation
		track.on('start', this.startRace);

		// check if not racing
		if (!!this.options.noRace) {
			this.attachSlider();
		}

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
		const { skipCountdown, noRace } = options;

		// no racing
		if (!!noRace) return;

		// check for countdowns
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
		const speeds = [ 5, 4.75, 4.5, 4.25, 4 ];
		const { track, options } = this;
		const { players } = track;
		const { fastRace, slowRace, winRace, loseRace, delayStart = 0 } = options;
		
		// track race state
		const state = { };
		
		// setup each player
		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			const isPlayer = !!player.options?.isPlayer;

			// grab a speed to use
			const index = 0 | (Math.random() * speeds.length);
			
			// grab a speed value to use
			const speed = speeds[index];
			if (slowRace) speed *= 0.25;
			if (fastRace) speed *= 2.5;
			if (winRace && isPlayer) speed *= 3.5;
			if (loseRace && isPlayer) speed *= 0.25;

			// don't allow more than one car to use it
			speeds.splice(index, 1);

			// save the player state
			state[`player_${i}`] = {
				speed,
				progress: 0,
				usedNitro: false
			};
		}
		
		// begins the race
		setTimeout(() => {
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
				
		}, delayStart);


	}

	// create a slider that scrubs the track forward and back a bit
	attachSlider = () => {
		const { track } = this;

		// don't finish more than once
		let hasFinished = false;

		// if not animated, include a range slider
		const slider = document.createElement('input');
		document.body.appendChild(slider);
		slider.id = 'track-scrubber';

		// set the range
		slider.type = 'range';
		slider.min = '-3000';
		slider.max = '15000';
		slider.value = '0';

		let origin = 0;
		slider.onmousedown = () => origin = track.track.trackPosition;
		slider.oninput = () => {
			if (!hasFinished && slider.value === slider.max) {
				this.immediateFinish();
				hasFinished = true;

				// disable for a moment to prevent messing up the
				// finish line animation
				slider.disabled = 'disabled';
				setTimeout(() => slider.disabled = '', 1000);
			}
			else {
				const value = -(0 | slider.value)
				track.setScroll(origin + value);
			}
		};

		slider.onchange = () => slider.value = '0';

	}

}