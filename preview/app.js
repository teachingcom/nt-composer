import { Animator } from 'nt-animator';
import * as PIXI from 'pixi.js';
import data from '../dist/export.json';

// reload page content
async function init() {

	// create the view
	const view = document.getElementById('view');
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

	// create the animation
	const animator = new Animator(data, { baseUrl: '/' });
	const instance = await animator.create('cars/police_cruiser');

	// attach to the view
	app.stage.addChild(instance);
	instance.x = width / 2;
	instance.y = height / 2;

	// periodically render
	function animate() {

		// update
		instance.update();

		// redraw
		app.render();

		// animate again
		requestAnimationFrame(animate);
	}

	// kick off the animation
	animate();
}

// initialize
window.addEventListener('load', init);