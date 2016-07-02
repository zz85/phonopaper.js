var synth = new Tone.SimpleSynth({
	oscillator:{
		type: "sine"
	}
}).toMaster();


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

		// meta.goto(meta.keys[1]);
		meta.pos = meta.keys[1];
	}

	return false;
}

function assertMarker(blacks, whites) {
	// console.log('blacks', blacks, 'whites', whites);

	if (blacks[2] < blacks[0] * 3) return false;
	if (blacks[2] < blacks[1] * 3) return false;
	if (blacks[2] < blacks[3] * 3) return false;
	if (whites[0] > blacks[0] * 3) return false;
	if (whites[1] > blacks[0] * 3) return false;
	if (whites[2] > blacks[0] * 3) return false;

	return true;
}

function Meta(bits) {
	this.pos = 0;
	this.bits = bits;
	this.fail = false;

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
	this.fail = false;

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
		this.pos = this.bits.length - n;
	}
}


function flip(bool, flip) {
	if (flip) return !bool;
	return bool;
}

MULTITONES = 8
TOTALNOTES = 96 * MULTITONES

notesOn = new Array(TOTALNOTES);

const PhonoPaper = {

	greyscaleImage: function(data) {

	},

	processImage: function(data) {

		// todo

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

		makeSomeNoise(notesOn);

		return true;

	}
};

function indexToFreq (index){
	// 0 - C1
	// 1 - C1#
	// 2 - D1
	// 12 - C2
	// 24 - C3
	// 36 - C4
	// 39 = A4 - 440Hz
	// 42 - C5

	var diff = 39 * MULTITONES - index;
	return Math.pow(2, diff/12 / MULTITONES) * 440;
}

function makeSomeNoise(notesOn){
	console.log(notesOn);
	notesOn.forEach(function(note, index){
		if (note){
			console.log(indexToFreq(index));
			synth.triggerAttackRelease(indexToFreq(index), 0.5);
		}
	});
}
