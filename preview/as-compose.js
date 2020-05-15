import toast from './toast';
import { Composer } from 'nt-track';
import manifest from '../dist/export.json';

export default async function setupAsCompose(target, data) {
	// always create a track
	const view = new Composer();

	// try and initialize the request
	try {
		await view.init({
			baseHeight: 800,
			target,
			manifest,
			baseUrl: '/'
		});

		// compose each item
		view.compose(data);
	}
	// handle failing to load
	catch (ex) {
		toast('error', 'Unable to compose request. Check the console for errors');
		throw ex;
	}

	// handle resizing
	const update = () => view.render();
	const resize = () => view.resize();

	return { update, resize };
}