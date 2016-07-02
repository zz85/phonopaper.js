function scanFirstLine(meta) {
	while (!meta.done()) {
		if (meta.next()) {

			meta.posFirst
			return;
		}

	}
	return done;
}

function done() {

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
	}
}

const PhonoPaper = {

	processImage: function(data) {

		// todo


	},

	processStrip: function(bits) {

		let meta = new Meta(bits);


		// 1. black
		while (!meta.isBlack() && !meta.next()) {}
		if (meta.done()) return false;
		meta.keys[0] = meta.pos;

		// 2. white
		while (meta.isBlack() && !meta.next()) {}
		if (meta.done()) return false;
		meta.keys[1] = meta.pos;

		// 3. black
		while (!meta.isBlack() && !meta.next()) {}
		if (meta.done()) return false;
		meta.keys[2] = meta.pos;




		return ['hey', meta];




		// this.mode = scanFirstLine;


		// let mode = this.mode(bits, 0);
		// while (mode !== done && i < bits.length) {
		// 	mode = this.mode(bits, 0);
		// }

		// console.log(mode, i);
	}
};