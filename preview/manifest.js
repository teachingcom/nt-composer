const manifest = { };

export async function loadManifest() {
	return new Promise((resolve, reject) => {

		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			console.log(this.status);
		};
		
		xhr.open('GET', '/manifest.json');
		xhr.send();
	});
}

export default manifest;