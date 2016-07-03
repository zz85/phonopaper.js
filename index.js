const THRESHOLD = 0.7;
const POLL = 30;

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
		setInterval( extract, POLL );
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

		process( image );

	}
}

function extract() {
	process( video );
}

function process( target ) {

	let width = canvas.width;
	let height = canvas.height;
	let pixels = width * height;


	idata = ctx.getImageData( 0, 0, width, height );

	// conversion to greyscale
	const greyscale = PhonoPaper.greyscaleImage( idata );

	// apply threshold
	const dark = PhonoPaper.thresholdImage( greyscale, width, height, THRESHOLD );

	// process bits
	const ok = PhonoPaper.processStrip( dark );
	makeSomeNoise(notesOn);

	ctx.clearRect(0, 0, width, height);

	ctx.drawImage( target, 0, 0 );
	ctx.strokeStyle = 'yellow';

	ctx.beginPath();
	const midWidth = width / 2 | 0;
	ctx.rect(midWidth - 2, 0, 3, height);
	ctx.stroke();

	if (ok) {
		for ( let i = 0; i < height; i ++ ) {
			if (dark[i]) {
				ctx.beginPath();
				ctx.rect(midWidth - 10, i, 5, 1);

				ctx.fillStyle = i > ok.top && i < ok.bottom ? 'red' : 'blue';
				ctx.fill();
			}
		}
	}
}

function setup() {
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');

	document.body.appendChild(canvas);
}

function loadUserMedia() {
	video = document.createElement('video');
	video.autoplay = true;
	document.body.appendChild(video);

	video.oncanplay = function() {
		// console.log('oncanplay', video.clientWidth, video.clientHeight);
		canvas.width = video.clientWidth;
		canvas.height = video.clientHeight;
		setInterval(extract, POLL);
	}

	navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	var tw = 1280 // 320 // 640 // 1280;
	var th = 720 // 240 // 480 // 720

	var hdConstraints = {
		audio: false,
		video: {
			mandatory: {
				maxWidth: tw,
				maxHeight: th
			}
		}
	};

	if (navigator.getUserMedia) {
		navigator.getUserMedia(hdConstraints, success, errorCallback);
	} else {
		errorCallback('');
	}

	function errorCallback(e) {
		console.log('Cant access user media', e);
	}

	function success(stream) {
		console.log('success', stream);
		video.src = window.URL.createObjectURL(stream);
		video.onclick = function() { video.play(); };
		video.play();
	}
}


setup();
const media = window.location.hash;
if (media == "#img"){
	loadImage();
} else if (media == "#um"){
	loadUserMedia();
} else{
	loadVideo();
}
