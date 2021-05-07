import * as fsx from 'fs-extra';
import { createCanvas, loadImage } from "canvas";
import { fileToKey } from "./utils";

// generates a spritesheet that uses the sprite as padding
// this is helpful when the rendering engine does a bad job
// at preventing bleed on textures and you're not using
// an image with transparency
export async function createSpritePaddedSpritesheet(target, width, height, coordinates, padding) {
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	const halfPadding = padding / 2;

	const waiting = [ ];
	for (const file in coordinates) {
		waiting.push(
			loadImage(file).then(image => {
				const { x, y, width, height } = coordinates[file];

				// render the bonus area and then draw the image
				// over the top
				ctx.drawImage(image, x - halfPadding, y - halfPadding, width + padding, height + padding);
				ctx.drawImage(image, x, y, width, height);
			}));
	}

	// wait for all drawings
	await Promise.all(waiting);

	// save the final image
	const buffer = canvas.toBuffer();
	await fsx.writeFile(target, buffer);
}