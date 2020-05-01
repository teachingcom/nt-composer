import { Animator } from 'nt-animator';
import * as PIXI from 'pixi.js';
import data from '../dist/export.json';

// sharing for debugging help
window.COMPOSER = data;

// location to save the editing path
const PATHS_LOCAL_STORAGE = 'nt-animator:path';
const DEFAULT_MESSAGE = 'Enter node paths to render';
const INCLUDE_AS_DETATCHED = ['trail'];

/** shows a quick error message */
function toast(type, message) {
	const msg = document.getElementById('msg');
	msg.className = `${type} show`;
	msg.innerText = message;
	setTimeout(() => msg.className = type, 3000);
}

// reload page content
async function init() {
	const paths = document.getElementById('paths');
	const view = document.getElementById('view');

	// setup the node editor
	paths.contentEditable = true;
	paths.innerText = window.localStorage.getItem(PATHS_LOCAL_STORAGE) || DEFAULT_MESSAGE;
	paths.onblur = onUpdatePaths;

	// create the application
	const bounds = view.getBoundingClientRect();
	const width = bounds.right - bounds.left;
	const height = bounds.bottom - bounds.top;
	const app = new PIXI.Application({
		resolution: window.devicePixelRatio || 1,
		backgroundColor: 0x272821,
		width, height
	});

	// add to the view
	view.appendChild(app.view);

	// save last known state and reload
	function onUpdatePaths() {
		window.localStorage.setItem(PATHS_LOCAL_STORAGE, paths.innerText);
		onReload();
	}

	// create the animation
	async function onReload() {

		// get all paths to load
		const input = paths.innerText;
		if (input === DEFAULT_MESSAGE) return;
		const refs = input.split(/\n/g).map(line => line.trim());

		// reset the view
		app.stage.removeChildren();

		// create the animator and then load each path
		const animator = new Animator(data, { baseUrl: '/' });
		const instances = { };

		// create a base container
		const container = new PIXI.Container();
		app.stage.addChild(container);
		container.x = width / 2;
		container.y = height / 2;
		
		// helper to add child layers
		function addChild(instance, type) {
			console.log('adding', type);
			
			// keep track of the type for additional positioning
			instance.type = type;
			instances[type] = instances[type] || [ ];
			instances[type].push(instance);

			// add to the container
			container.addChild(instance);
		}

		// include each ref
		try {
			for (const ref of refs) {

				// ignore blank lines
				if (!ref) continue;

				// create the instance
				const instance = await animator.create(ref);
				if (!instance) {
					throw new Error(`${ref} does not refer to a node with composition properties`);
				}

				// check for types that should add each child independently
				if (!!~INCLUDE_AS_DETATCHED.indexOf(instance.type)) {

					// adding in reverse order - adding forwards causes the
					// array length to change and miss half of the items
					for (let i = instance.children.length; i-- > 0;)
						addChild(instance.children[i], instance.type);
				}
				// entire object should be added
				else addChild(instance, instance.type);
					
			}
		}
		catch (ex) {
			toast('error', 'Failed to load some animator instances. Check the console for information');
			throw ex;
		}

		// sort by z-index
		container.sortChildren();

		// finally, adjust positions if we have multiple
		// types so it's easier to preview

		// with both cars and trails then
		// move the car so the tail is at the end
		// and then shift the container back slightly
		if (instances.car && instances.trail) {
			container.x -= width * 0.005;
			for (const car of instances.car) {
				car.x += car.width / 2;
			}
		}
		// if only a trail, nudge it forward to
		// fit more of it into view
		else if (instances.trail) {
			container.x += width * 0.25;
		}


		// added
		toast('success', 'View updated with new compositions');
	}

	// periodically render
	function animate() {

		// update
		// instance.update();

		// redraw
		app.render();

		// animate again
		requestAnimationFrame(animate);
	}

	// kick off the animation
	await onReload();
	animate();
}

// initialize
window.addEventListener('load', init);