
let canvas, ctx;

function setup() {
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');

	document.body.appendChild(canvas);


	const image = new Image();
	image.src = 'samples/your_sound.small.jpg';

	image.onload = function(e) {
		console.log( image.width, image.height );

		canvas.width = image.width;
		canvas.height = image.height;

		ctx.drawImage( image, 0, 0 );

		let idata = ctx.getImageData( 0, 0, image.width, image.height );
		let data = idata.data;
		let pixels = image.width * image.height;

		greyScale = new Float32Array( pixels );
		for ( let i = 0; i < greyScale.length; i++ ) {
			let ref = i * 4;
			let r = data[ ref + ref + 0 ] / 255;
			let g = data[ ref + ref + 1 ] / 255;
			let b = data[ ref + ref + 2 ] / 255;

			greyScale[ i ] = 0.2126 * r + 0.7152 * b + 0.0722 * b;
		}

		PhonoPaper.processImage( idata );

	}
}


setup();