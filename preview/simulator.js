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
		if (skipRace) {
			this.immediateFinish();
			setTimeout(() => {
				this.track.simulateFinish();
			}, 2000)
		}
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
		else {
			this.track.startCountdown();
			setTimeout(this.startRace, 0 | (4000 + (Math.random() * 300)));
		}
	}

	// immediately jumps to the finish animation
	immediateFinish = () => {
		const { track } = this;
		const finished = _.shuffle(track.players);

		// start the 
		let count = 0;
		const now = +new Date;
		_.each(finished, player => {

			// get the final progress update
			const delay = ++count * 500;
			const completed = now + (instant ? (0 | (Math.random() * 300)) : delay);
			const instant = Math.random() < 0.5 || player.isPlayer;
			const result = {
				progress: 100,
				finished: true,
				typed: 100,
				typingSpeedModifier: 0,
			};

			// handle finishes
			const finish = () => {
				track.setProgress(player.id, result);
				setTimeout(() => {
					result.completed = completed;
					track.setProgress(player.id, result);
				}, 1000)
			};
			
			// finalize the race
			if (instant) finish();
			else setTimeout(finish, delay);

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
		const { forceNitros, fastRace, slowRace, winRace, loseRace, delayStart = 0 } = options;
		
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
			if (fastRace) speed *= 1.5;
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

		// the interval
		let updater;
		
		// begins the race
		setTimeout(() => {
			track.startRace();

			// bump each player forward
			updater = setInterval(() => {
				let didNitro = false;

				// nudge forward
				let allFinished = true;
				for (const id in state) {
					const player = state[id];
					const completed = player.progress >= 100 ? +new Date : null;
					const finished = !!completed;

					// if this person is racing still
					if (!finished) allFinished = false;

					// increment progress
					player.progress += 0 | Math.max(1, (player.speed * 2) * Math.random());

					// check for nitros
					if (!didNitro
						&& !fastRace
						&& !forceNitros
						&& !player.usedNitro
						&& Math.random() < (player.progress / 100)) {
						didNitro = player.usedNitro = true;
						track.activateNitro(id);
					}

					// update progress
					track.setProgress(id, { progress: player.progress, finished, completed });
				}

				// if all done
				if (allFinished)
					clearInterval(updater);

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