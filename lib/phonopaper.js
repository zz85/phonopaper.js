
const context = new AudioContext();

const MULTITONES = 2;
const TOTALNOTES = 96 * MULTITONES;

const notesOn = new Array(TOTALNOTES).fill(0);

const synths = notesOn.map( (val,index) => {
	var osc = context.createOscillator();
	var gain = context.createGain();
	osc.type = 'triangle';
	osc.frequency.value = indexToFreq(index);
	gain.gain.value = 0;
	osc.connect(gain);
	gain.connect(context.destination);
	osc.start(0);
	return {
		osc: osc,
		gain: gain
	}
})

const synthState =  new Array(TOTALNOTES).fill(0);

function findMarkers(meta) {
	while (!meta.done()) {
		// console.log('scanning marker..');

		// find alternate marker positions
		for (let i = 0; i < 8; i++) {
			while (flip(meta.isBlack(), i % 2 === 0) && !meta.next()) {

			}
			if (meta.done()) return false;
			meta.keys[i] = meta.pos;
		}

		var blacks = [];
		var whites = [];
		for (let i = 0; i < 8; i += 2) {
			blacks.push(meta.keys[i + 1] - meta.keys[i]);
		}

		for (let i = 1; i < 7; i += 2) {
			whites.push(meta.keys[i + 1] - meta.keys[i]);
		}

		blacks = blacks.map(Math.abs);
		whites = whites.map(Math.abs);

		if (assertMarker(blacks, whites)) {
			meta.blacks = blacks;
			meta.whites = whites;

			return true;
		} else {
			// console.log('marker assertion fail');
		}

		meta.goto(meta.keys[1]);
	}

	return false;
}

function assertMarker(blacks, whites) {
	// Thick should be 3x more than thins
	if (blacks[2] < blacks[0] * 3) return false;
	if (blacks[2] < blacks[1] * 3) return false;
	if (blacks[2] < blacks[3] * 3) return false;

	// Whites should be one third
	if (whites[0] > blacks[0] * 3) return false;
	if (whites[1] > blacks[0] * 3) return false;
	if (whites[2] > blacks[0] * 3) return false;

	// if ( Math.abs(blacks[0]  -  blacks[1]) > 1 ) return false;
	// if ( Math.abs(blacks[3]  -  blacks[1]) > 2 ) return false;

	// console.log('blacks', blacks, 'whites', whites);

	return true;
}

function Meta(bits) {
	this.pos = 0;
	this.bits = bits;

	this.keys = new Array(7);
}

Meta.prototype = {
	next: function() {
		this.pos++;
		return this.done()
	},
	done: function() {
		return this.pos > this.bits.length;
	},
	isBlack: function() {
		return this.bits[this.pos];
	},
	goto: function(n) {
		this.pos = n;
	}
}

function ReverseMeta(bits) {
	this.pos = bits.length - 1;
	this.bits = bits;

	this.keys = new Array(7);
}

ReverseMeta.prototype = {
	next: function() {
		this.pos--;
		return this.done()
	},
	done: function() {
		return this.pos < 0;
	},
	isBlack: function() {
		return this.bits[this.pos];
	},
	goto: function(n) {
		this.pos = n;
	}
}


function flip(bool, flip) {
	if (flip) return !bool;
	return bool;
}

const PhonoPaper = {

	greyscaleImage: function( idata ) {

		let data = idata.data;
		let pixels = idata.width * idata.height;

		// conversion to greyscale
		let greyscale = new Float32Array( pixels );
		for ( let i = 0; i < pixels; i++ ) {
			let ref = i * 4;
			let r = data[ ref + 0 ] / 255;
			let g = data[ ref + 1 ] / 255;
			let b = data[ ref + 2 ] / 255;

			// Y'=0.299R'+0.587G'+0.114B'
			greyscale[ i ] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}

		return greyscale;

	},

	thresholdImage: function( greyscale, width, height, threshold ) {

		const dark = new Array( height );
		const midWidth = width / 2 | 0;

		for ( let i = 0; i < height; i ++ ) {
			dark[i] = greyscale[ i * width + midWidth ] < threshold;
		}

		return dark;

	},

	processStrip: function(bits) {

		notesOn.fill(0);

		let meta = new Meta(bits);

		// console.log('finding top marker');
		let ok = findMarkers(meta);
		if (!ok) return false;

		// console.log('finding bottom marker');
		let reverseMeta = new ReverseMeta(bits);
		ok = findMarkers(reverseMeta);
		if (!ok) return false;

		// console.log(meta.keys, meta.blacks, meta.whites);
		// console.log('bottom marker ok');

		let top = meta.keys[6] + meta.whites[2];
		let bottom = reverseMeta.keys[6] - meta.whites[2]

		// let top = meta.keys[6];
		// let bottom = reverseMeta.keys[6];
		let range = bottom - top;

		let bucket = range / TOTALNOTES;

		for (let i = top + 1; i < bottom; i++) {
			if (bits[i]) {
				let dy = i - top;
				notesOn[ dy / bucket | 0 ] = 1;
			}
		}

		// console.log('OCTAVE RANGE', top, bottom, notesOn);
		return {
			top: top,
			bottom: bottom
		};

	}
};

function indexToFreq(index) {
	// 0 - C1
	// 1 - C1#
	// 2 - D1
	// 12 - C2
	// 24 - C3
	// 36 - C4
	// 39 = A4 - 440Hz
	// 42 - C5

	var diff = 39 * MULTITONES - index;
	return Math.pow( 2, diff / 12 / MULTITONES ) * 440;
}

function makeSomeNoise(notesOn) {
	// console.log(notesOn);
	notesOn.forEach(function(note, index) {
		if (note) {
			// console.log(indexToFreq(index));
			if (!synthState[index]) {
				synths[index].gain.gain.value = 1;
			}
			synthState[index] = 1;
		} else {
			if (synthState[index]) {
				synths[index].gain.gain.value = 0;
			}
			synthState[index] = 0;
		}
	});
}
