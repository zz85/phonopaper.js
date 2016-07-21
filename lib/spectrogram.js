// Adapted from http://bl.ocks.org/vlandham/9313904

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// helper function for loading one or more sound files
function loadSounds(obj, context, soundMap, callback) {
	var names = [];
	var paths = [];
	for (var name in soundMap) {
		var path = soundMap[name];
		names.push(name);
		paths.push(path);
	}
	bufferLoader = new BufferLoader(context, paths, function(bufferList) {
		for (var i = 0; i < bufferList.length; i++) {
			var buffer = bufferList[i];
			var name = names[i];
			obj[name] = buffer;
		}
		if (callback) {
			callback();
		}
	});
	bufferLoader.load();
}

// class that performs most of the work to load
// a new sound file asynchronously
// originally from: http://chimera.labs.oreilly.com/books/1234000001552/ch02.html
function BufferLoader(context, urlList, callback) {
	this.context = context;
	this.urlList = urlList;
	this.onload = callback;
	this.bufferList = new Array();
	this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
	// Load buffer asynchronously
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";

	var loader = this;

	request.onload = function() {
		// Asynchronously decode the audio file data in request.response
		loader.context.decodeAudioData(
			request.response,
			function(buffer) {
				if (!buffer) {
					alert('error decoding file data: ' + url);
					return;
				}
				loader.bufferList[index] = buffer;
				if (++loader.loadCount == loader.urlList.length)
					loader.onload(loader.bufferList);
			},
			function(error) {
				console.error('decodeAudioData error', error);
			}
		);
	}

	request.onerror = function() {
		alert('BufferLoader: XHR error');
	}
	request.send();
};

BufferLoader.prototype.load = function() {
	for (var i = 0; i < this.urlList.length; ++i)
	this.loadBuffer(this.urlList[i], i);
};

// ---
// Spectrogram class
// constructor takes a filename, selector
// out where to display, and a big options hash.
// (not a great api - I know!)
// sets up most of the configuration for the sound analysis
// and then loads the sound using loadSounds.
// Once finished loading, the setupVisual callback
// is called.
// ---
function Spectrogram(filename, options) {
	if (!options) {
		options = {};
	}
	this.options = options;

	var SMOOTHING = 0.0;
	var FFT_SIZE = 32768; // 2048 4096 8192 16384 32768

	this.sampleRate = options.sampleSize || 4096; // 256 1024 2048 4096 16384
	this.decRange = [-80.0, 80.0];


	// 2048 bins for 44K
	// 96 semitones
	// 0 - C1
	// 1 - C1#
	// 2 - D1
	// 12 - C2
	// 24 - C3
	// 36 - C4
	// 39 = A4 - 440Hz
	// 42 - C5

	this.filename = filename;
	this.context = context = new AudioContext();
	this.analyser = context.createAnalyser();
	this.javascriptNode = context.createScriptProcessor(this.sampleRate, 1, 1);

	// this.analyser.minDecibels = this.decRange[0];
	// this.analyser.maxDecibels = this.decRange[1];

	this.analyser.smoothingTimeConstant = SMOOTHING;
	this.analyser.fftSize = FFT_SIZE;

	console.log('frequencyBinCount', this.analyser.frequencyBinCount)

	this.freqs = new Float32Array(this.analyser.frequencyBinCount);
	this.buffer = new Float32Array(this.analyser.frequencyBinCount);
	this.buffer2 = new Float32Array(this.analyser.frequencyBinCount);

	this.isPlaying = false;
	this.isLoaded = false;
	this.startTime = 0;
	this.startOffset = 0;
	this.count = 0;
	this.curSec = 0;
	this.maxCount = 0;

	loadSounds(this, this.context, {
		buffer: this.filename
	}, this.togglePlayback.bind(this));
}

// ---
// process
// callback executed each onaudioprocess of the javascriptNode.
// performs the work of analyzing the sound and storing the results
// in a big array (not a great idea, but I haven't thought of something
// better.
// ---
Spectrogram.prototype.process = function(e) {
	// console.log('process', e);

	this.analyser.getFloatFrequencyData(this.freqs);

	for (var i = 0; i < this.freqs.length; i++) {
		var k = i / this.freqs.length;
		var l = 1 - k;
		var x = this.convert(this.freqs[i]);
		// this.buffer[i] = x; //  * (1 - (l * l)) * 10;
		this.buffer[i] = x * x * x * x
	}

	// post processing
	for (var i = 0; i < this.freqs.length; i++) {
		var top = i > 0 ? this.buffer[ i - 1 ] : 0;
		var bottom = i < this.freqs.length ? this.buffer[ i + 1 ] : 0;

		// kernel
		// this.buffer2[i] = this.buffer[i]; // no pp
		this.buffer2[i] = 0.25 * this.buffer2[i] + 0.75 * this.buffer[i]; // damping

		// this.buffer2[i] = this.buffer[i] * .5 + top * 0.25 + bottom * 0.25; // spread
		// this.buffer2[i] = -this.buffer[i] * 3 + top * 1 + bottom * 1; // edge
		// this.buffer2[i] = this.buffer[i] * 3 - top * 1 - bottom * 1; // sharpen?
		// this.buffer2[i] = Math.min( this.buffer[i], top, bottom ); // min
		// this.buffer2[i] = Math.max( this.buffer[i], top, bottom ); // max



		// this.buffer2[i] = this.buffer2[i] > 0.55 ? this.buffer2[i] : this.buffer2[i] * 0.5;

	}


	draw();

	if(this.isPlaying && !this.isLoaded) {
		this.count += 1;
		this.curSec =  (this.sampleRate * this.count) / this.buffer.sampleRate;
		// if(this.count >= this.maxCount) {
		// 	this.togglePlayback();
		// 	this.isLoaded = true;
		// }
	}
}

// ---
// showProgress
// ---
Spectrogram.prototype.showProgress = function() {
	console.log('showProgress', this.isPlaying, this.isLoaded)
	if(this.isPlaying && this.isLoaded) {
		this.curDuration = (this.context.currentTime - this.startTime);
		this.count += 1;
		this.curSec = (this.sampleRate * this.count) / this.buffer.sampleRate;
	}
}


// ---
// Toggle playback
// ---
Spectrogram.prototype.togglePlayback = function() {
	console.log('togglePlayback', this.isPlaying);
	if (this.isPlaying) {
		this.source.stop(0);
		this.startOffset += this.context.currentTime - this.startTime;
		console.log('paused at', this.startOffset);
		// this.button.attr("disabled", null);
	} else {
		// this.button.attr("disabled", true);
		this.startTime = this.context.currentTime;
		this.count = 0;
		this.curSec = 0;
		this.curDuration = 0;
		this.source = this.context.createBufferSource();
		this.source.buffer = this.buffer;
		this.analyser.buffer = this.buffer;
		this.javascriptNode.onaudioprocess = this.process.bind(this);

		// Connect graph
		this.source.connect(this.analyser);
		this.analyser.connect(this.javascriptNode);

		this.source.connect(this.context.destination);
		this.javascriptNode.connect(this.context.destination);

		this.source.loop = false;
		this.source.start(0, this.startOffset % this.buffer.duration);

		console.log('started at', this.startOffset);

		if (this.isLoaded) {

		}
	}
	this.isPlaying = !this.isPlaying;
}

// ---
// ---
Spectrogram.prototype.getFrequencyValue = function(freq) {
	var nyquist = this.context.sampleRate /2;
	var index = Math.round(freq/nyquist * this.freqs.length);
	return this.buffer2[index] * 255 | 0;
}


Spectrogram.prototype.getBin = function(freq) {
	var nyquist = this.context.sampleRate /2;
	var index = Math.round(freq/nyquist * this.freqs.length);
	return index;
}


Spectrogram.prototype.getFrequencyAtBin = function(index) {
	return this.buffer2[index] * 255 | 0;
}


Spectrogram.prototype.convert = function(freq) {
	var min = this.analyser.minDecibels;
	var max = this.analyser.maxDecibels;
	var range = max - min;

	if ( freq < min ) freq = min;
	if ( freq > max ) freq = max;

	return (freq - min) / range;
}


// ---
// ---
Spectrogram.prototype.getBinFrequency = function(index) {
	var nyquist = this.context.sampleRate / 2;
	var freq = index / this.freqs.length * nyquist;
	return freq;
}