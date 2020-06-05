
// activates a simulated race
export class RaceSimulator {

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
		const speeds = [ 5, 4.5, 4, 3.5, 3 ];
		const { track, options } = this;
		const { players } = track;
		const { fastRace, slowRace } = options;
		
		// track race state
		const state = { };
		
		// setup each player
		for (let i = 0; i < players.length; i++) {

			// grab a speed to use
			const index = 0 | (Math.random() * speeds.length);
			const speed = (speeds[index] * slowRace ? 0.25 : 1);
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

}