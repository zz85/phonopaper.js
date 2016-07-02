function findMarkers(meta) {
	while (!meta.done()) {
		console.log('scanning top marker');

		// find alternate marker positions
		for (let i = 0; i < 8; i++) {
			while (flip(meta.isBlack(), i % 2 === 0) && !meta.next()) {}
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
			console.log('marker ok', meta);
			return true;
		} else {
			console.log('marker assertion fail');
		}

		meta.goto(meta.keys[0]);
	}

	return false;
}

function assertMarker(blacks, whites) {
	console.log('blacks', blacks, 'whites', whites);

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

const PhonoPaper = {

	processImage: function(data) {

		// todo

	},

	processStrip: function(bits) {
		let meta = new Meta(bits);

		let ok = findMarkers(meta);
		if (!ok) return false;

		console.log('top marker ok');

		let reverseMeta = new ReverseMeta(bits);
		ok = findMarkers(reverseMeta);
		if (!ok) return false;

		console.log('bottom marker', ok, reverseMeta);

		return true;

	}
};