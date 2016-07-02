
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

		console.log('blacks', blacks, 'whites', whites);

		return ['hey', meta];

	}
};