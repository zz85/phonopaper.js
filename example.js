
let canvas, ctx;

function loadVideo() {
	video = document.createElement('video');
	video.src = 'samples/video.mov';
	video.autoplay = true;
	video.onplay = function() {
		console.log('started playing', video.width, video.height);
	}
	video.muted = true;

	// loadeddata loadedmetadata loadstart

	video.oncanplay = function() {
		console.log('oncanplay', video.clientWidth, video.clientHeight);
		canvas.width = video.clientWidth;
		canvas.height = video.clientHeight;
		setInterval(process, 100);
	}

	document.body.appendChild(video);

}


function loadImage() {
	const image = new Image();
	image.src = 'samples/your_sound.small.jpg';
	// image.src = 'samples/your_sound2.png';
	image.src = 'samples/bach - prelude & fugue 8_.jpg';
	// image.src = 'samples/sample.png';

	image.onload = function(e) {
		console.log( 'resolution', image.width, image.height );

		canvas.width = image.width;
		canvas.height = image.height;

		ctx.drawImage( image, 0, 0 );
		ctx.strokeStyle = 'yellow';
		ctx.fillStyle = 'red';

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
			dark[i] = greyScale[ i * width + midWidth ] < THRESHOLD;

			if (dark[i]) {
				ctx.beginPath();
				ctx.rect(midWidth - 10, i, 5, 1);
				ctx.fill();
			}
		}

		// console.log( dark );

		// process bits
		let ok = PhonoPaper.processStrip( dark );
		// console.log('ok', ok);

		// PhonoPaper.processImage( greyScale );

	}
}

function process() {

	let width = canvas.width;
	let height = canvas.height;
	let pixels = width * height;


	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage( video, 0, 0 );
	ctx.strokeStyle = 'yellow';
	ctx.fillStyle = 'red';

	ctx.beginPath();
	let midWidth = width / 2 | 0;
	ctx.rect(midWidth - 2, 0, 3, height);
	ctx.stroke();

	let idata = ctx.getImageData( 0, 0, width, height );
	let data = idata.data;


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
		dark[i] = greyScale[ i * width + midWidth ] < THRESHOLD;

		if (dark[i]) {
			ctx.beginPath();
			ctx.rect(midWidth - 10, i, 5, 1);
			ctx.fill();
		}
	}

	// console.log( dark );

	// process bits
	let ok = PhonoPaper.processStrip( dark );
	// console.log('ok', ok);
}

function setup() {
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');

	document.body.appendChild(canvas);
}


setup();
// loadImage();
loadVideo();
