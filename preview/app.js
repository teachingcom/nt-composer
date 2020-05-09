
import { Animator } from 'nt-animator';
import { Track } from 'nt-track';

import toast from './toast';
import editor from './editor';

// import * as PIXI from 'pixi.js';
import manifest from '../dist/export.json';

// sharing for debugging help
window.MANIFEST = manifest;

// there's probably a fancy math trick
// to do this but I don't know it
const LANE_PATTERN = [ [2], [1,3], [0,2,4], [0,1,2,4], [0,1,2,3,4] ];

// location to save the editing path

// const INCLUDE_AS_DETATCHED = ['trail'];


// reload page content
async function init() {
	const target = document.querySelector('#view > canvas');

	// always create a track
	// TODO: this is for now, later depending on
	// what is loaded, switch to Garage/Preview modes
	const track = new Track({
		target,
		manifest,
		baseUrl: '/',
		staticUrl: '/cars'
	});

	// prepare
	await track.init();

	// setup edit handling
	editor.init(reload);

	// handles loading a view
	async function reload(data) {
		console.log(data);
		
		// look up the track to use
		if (data.tracks.length > 0) {
			const path = data.tracks.pop();

			// try and create the track
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

		}

		// include each car
		for (let i = 0; i < data.cars.length; i++) {
			const car = data.cars[i];
			const params = {
				type: car.type,
				lane: LANE_PATTERN[data.cars.length - 1][i],
				hue: car.hue,
				loot: car.loot
			};

			await track.addCar(params);
		}
		

		

	}
	
	// // placeholder for the track
	// let track;


	// track = new Track({
	// 	target,
	// 	manifest,
	// 	baseUrl: '/',
	// 	staticUrl: '/cars'
	// });

	// await track.init({ seed: 'this is expected' });

	window.addEventListener('resize', track.resize);

	// track.addCar({
	// 	type: 'legacy_car',
	// 	lane: 1,
	// 	hue: 180,
	// 	loot: {
	// 		trail: 'phaser',
	// 	}
	// });

	// track.addCar({
	// 	type: 'grid',
	// 	lane: 0,
	// 	loot: {
	// 		trail: 'phaser'
	// 	}
	// });

	// track.addCar({
	// 	type: 'basic',
	// 	lane: 3,
	// 	loot: {
	// 		trail: 'frosty',
	// 	}
	// });

	// track.addCar({
	// 	type: 'grid',
	// 	hue: 180,
	// 	lane: 2,
	// 	loot: {
	// 		trail: 'burnout',
	// 	}
	// });

	// track.addCar({
	// 	type: 'basic',
	// 	lane: 4,
	// 	hue: -90,
	// 	loot: {
	// 		trail: 'phaser',
	// 	}
	// });

	

	// // // save last known state and reload
	// // editor.init(onData);

	// // // create the animation
	// // async function onData(data) {
	// // 	console.log('data', data);

	// // 	// get all paths to load
	// // 	const input = paths.innerText;
	// // 	if (editor.isDefault()) return;

	// // 	// get all resources to load
	// // 	const refs = input.split(/\n/g)
	// // 		.map(line => line.trim())
	// // 		.filter(str => str.length);

	// // 	// initialize the track
	// // 	const instance = new Track({
	// // 		target,
	// // 		data: manifest
	// // 	});

	// // 	// initialize the view
	// // 	await instance.init();

	// // 	// load in each resource
	// // 	each(data.cars, car => {
			

	// // 	});

	// // 	// save the version
	// // 	track = instance;
	// // 	animate();

	// // 	// load each ref



	// // 	// reset the view
	// // 	// app.stage.removeChildren();

	// // 	// // create the animator and then load each path
	// // 	// const animator = new Animator(data, { baseUrl: '/' });
	// // 	// const instances = { };

	// // 	// // create a base container
	// // 	// const container = new PIXI.Container();
	// // 	// app.stage.addChild(container);
	// // 	// container.x = width / 2;
	// // 	// container.y = height / 2;
		
	// // 	// // helper to add child layers
	// // 	// function addChild(instance, type) {
	// // 	// 	console.log('adding', type);

	// // 	// 	if (type === 'car') {
	// // 	// 		const { base } = instance.instances;

	// // 	// 		// missing required base layer
	// // 	// 		if (!base) {
	// // 	// 			console.error(`Car ${instance.type.data} missing a required "base" layer`);
	// // 	// 		}
	// // 	// 		// scale to fit
	// // 	// 		else {
	// // 	// 			const { displayObject } = base;
	// // 	// 			container.scale.x = container.scale.y = 100 / displayObject.height;
	// // 	// 			console.log(container.scale.x);
	// // 	// 		}

	// // 	// 	}
			
	// // 	// 	// keep track of the type for additional positioning
	// // 	// 	instance.type = type;
	// // 	// 	instances[type] = instances[type] || [ ];
	// // 	// 	instances[type].push(instance);

	// // 	// 	// add to the container
	// // 	// 	instance.zIndex = 100 + (instance.zIndex || 0);
	// // 	// 	container.addChild(instance);
	// // 	// }

	// // 	// // include each ref
	// // 	// try {
	// // 	// 	for (const ref of refs) {

	// // 	// 		// ignore blank lines
	// // 	// 		if (!ref) continue;

	// // 	// 		// create the instance
	// // 	// 		const instance = await animator.create(ref);
	// // 	// 		if (!instance) {
	// // 	// 			throw new Error(`${ref} does not refer to a node with composition properties`);
	// // 	// 		}

	// // 	// 		// check for types that should add each child independently
	// // 	// 		if (!!~INCLUDE_AS_DETATCHED.indexOf(instance.type)) {

	// // 	// 			// adding in reverse order - adding forwards causes the
	// // 	// 			// array length to change and miss half of the items
	// // 	// 			for (let i = instance.children.length; i-- > 0;)
	// // 	// 				addChild(instance.children[i], instance.type);
	// // 	// 		}
	// // 	// 		// entire object should be added
	// // 	// 		else addChild(instance, instance.type);
					
	// // 	// 	}
	// // 	// }
	// // 	// catch (ex) {
	// // 	// 	toast('error', 'Failed to load some animator instances. Check the console for information');
	// // 	// 	throw ex;
	// // 	// }

	// // 	// // sort by z-index
	// // 	// container.sortChildren();

	// // 	// // finally, adjust positions if we have multiple
	// // 	// // types so it's easier to preview

	// // 	// // with both cars and trails then
	// // 	// // move the car so the tail is at the end
	// // 	// // and then shift the container back slightly
	// // 	// if (instances.car && instances.trail) {
	// // 	// 	container.x -= width * 0.005;
	// // 	// 	for (const car of instances.car) {
	// // 	// 		car.x += car.width / 2;
	// // 	// 	}
	// // 	// }
	// // 	// // if only a trail, nudge it forward to
	// // 	// // fit more of it into view
	// // 	// else if (instances.trail) {
	// // 	// 	container.x += width * 0.25;
	// // 	// }


	// 	// added
	// 	toast('success', 'View updated with new compositions');
	// // }

	// handle track rendering
	function animate() {
		track.render();
		requestAnimationFrame(animate);
	}

	animate();

}

// initialize
window.addEventListener('load', init);