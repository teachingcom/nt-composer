import toast from './toast';
import { Composer } from 'nt-track';
import getManifest from './manifest';

export default async function setupAsCompose(target, data) {
	const manifest = await getManifest();

	// always create a track
	const view = new Composer();
	const container = target.parentNode;
	container.innerHTML = '';

	// try and initialize the request
	try {
		await view.init({
			baseHeight: 800,
			container,
			manifest,
			baseUrl: '/',
			silent: !!data.silent
		});

		// compose each item
		view.compose(data);
	}
	// handle failing to load
	catch (ex) {
		toast('error', 'Unable to compose request. Check the console for errors');
		throw ex;
	}

	// repeatedly activate nitros
	setTimeout(() => {
		view.activateNitro();
		setInterval(() => view.activateNitro(), 5000);
	}, 1000);

	// handle resizing
	const update = () => view.render();
	const resize = () => view.resize();
	const activateNitro = () => view.activateNitro();

	return { update, resize, activateNitro };
}