import toast from './toast';

const PATHS_LOCAL_STORAGE = 'nt-animator:path';
const DEFAULT_MESSAGE = 'Enter node paths to render';

// the change handler
let handleChange;

// grabs the editor area
const getElement = () => document.querySelector('#paths');
const getText = () => getElement().innerText;
const setText = val => getElement().innerText = val;

/** checks if the input is still the default message */
export function isDefault() {
	return getText() === DEFAULT_MESSAGE;
}

//** applies a change */
function commit() {
	const data = parse(true);
	if (data) handleChange(data);
}

/** handles initializing the editor area */
export function init(onChange) {
	handleChange = onChange;

	// setup the editor
	const paths = getElement();
	paths.contentEditable = true;
	setText(window.localStorage.getItem(PATHS_LOCAL_STORAGE) || DEFAULT_MESSAGE);

	// handle saving changes
	paths.addEventListener('blur', commit);
	paths.addEventListener('keydown', function(event) {
		if (event.shiftKey && event.keyCode === 13) this.blur();
	});

	// try and load initial data, if possible
	const data = parse();
	if (data) handleChange(data);
}

/** attempts to return the current data */
export function parse(saveChanges) {
	let seed;
	const cars = [ ];
	const trails = [ ];
	const nitros = [ ];
	const tracks = [ ];
	const comps = [ ];

	// tracking the current car, if any
	let car;
	
	// start parsing the changes
	try {
		const text = getText();
		const lines = text.split(/\n/g);
		for (let line of lines) {
			line = line.replace(/^\//, '');
		
			// choose the correct group
			if (/^cars/.test(line)) {
				const [path, hue] = line.split(/ +/g);

				// track this car to know where
				// to attach loot, if any
				car = {
					type: path.substr('cars/'.length),
					hue: 0|hue,
					loot: { }
				};

				// add the loot
				cars.push(car);
			}
			
			// trail types
			else if (/^trails/.test(line)) {
				if (car) car.loot.trail = line.substr('trails/'.length);
				else trails.push(line);
			}

			// track style
			else if (/^tracks/.test(line)) {
				tracks.push(line);
			}

			// nitro effect
			else if (/^nitros/.test(line)) {
				if (car) car.loot.nitro = line.substr('nitros/'.length);
				else nitros.push(line);
			}

			// if there's not any slashes, then it's the
			// seed value to use
			else if (!~line.indexOf('/'))
				seed = line.trim();

			// misc items such as track background elements
			else comps.push(line);

		}

		// seemed like it was okay, save it
		if (saveChanges) {
			window.localStorage.setItem(PATHS_LOCAL_STORAGE, text);
		}

		// return the final object
		return { seed, cars, tracks, trails, nitros, comps };
		
	}
	// couldn't parse the data
	catch (ex) {
		toast('error', 'Failed to parse instructions - Check console for errors');
		console.error(ex);
	}	 
}

export default {
	isDefault,
	parse,
	init
};