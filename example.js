
let canvas, ctx;

function setup() {
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');

	document.body.appendChild(canvas);


	const image = new Image();
	image.src = 'samples/your_sound.small.jpg';

	image.onload = function(e) {
		console.log( 'resolution', image.width, image.height );

		canvas.width = image.width;
		canvas.height = image.height;

		ctx.drawImage( image, 0, 0 );
		ctx.strokeStyle = 'yellow';

		ctx.beginPath();
		let midWidth = image.width / 2 | 0;
		let height = image.height;
		ctx.rect(midWidth - 2, 0, 3, height);
		ctx.stroke();

		let idata = ctx.getImageData( 0, 0, image.width, image.height );
		let data = idata.data;

		let width = image.width;
		let pixels = image.width * image.height;

		// conversion to greyscale
		greyScale = new Float32Array( pixels );
		for ( let i = 0; i < pixels; i++ ) {
			let ref = i * 4;
			let r = data[ ref + 0 ] / 255;
			let g = data[ ref + 1 ] / 255;
			let b = data[ ref + 2 ] / 255;

			// Y'=0.299R'+0.587G'+0.114B'
			greyScale[ i ] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}

		const THRESHOLD = 0.7;

		dark = new Array(height);

		// apply threshold
		for ( let i = 0; i < height; i ++ ) {
			dark[i] = greyScale[ i * width + midWidth ] > THRESHOLD;
		}

		console.log( dark );

		// process bits
		PhonoPaper.processStrip( dark );



		// PhonoPaper.processImage( greyScale );

	}
}


setup();