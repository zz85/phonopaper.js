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
	this.i = 0;
	this.bits = bits;
	this.fail = false;
}

Meta.prototype = {
	next: function() {
		return this.bits[i++];
	},
	done: function() {
		return i > this.bits.length;
	}
}

const PhonoPaper = {

	processImage: function(data) {

		// todo


	},

	processStrip: function(bits) {

		let meta = new Meta(bits);

		this.mode = scanFirstLine;


		let mode = this.mode(bits, 0);
		while (mode !== done && i < bits.length) {
			mode = this.mode(bits, 0);
		}

		console.log(mode, i);
	}
};