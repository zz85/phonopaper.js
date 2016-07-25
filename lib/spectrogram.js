// References
// http://www.embedded.com/design/configurable-systems/4024443/The-Goertzel-Algorithm

function GF(frequencies, sample_rate, samples) {
	this.frequencies = frequencies; // target Freq
	this.sample_rate = sample_rate // samplingFrequency
	this.block_size = samples; // N

	this.k = frequencies.map( f => (0.5 + samples * f / sample_rate) );
	this.w = this.k.map( k => 2 * Math.PI / samples * k )
	// w = (2*π/N)*k
	// coefficient= 2.0*cos(2.0*PI*dFreq/sFreq);

	this.cosine = this.w.map( Math.cos )
	this.sine = this.w.map( Math.sin )
	this.coeff = this.cosine.map(cosine => cosine * 2);
	this.powers = new Float32Array(frequencies.length);
	this.real = new Float32Array(frequencies.length);
	this.imag = new Float32Array(frequencies.length);

	this.resampled = new Float32Array(samples);
}

GF.prototype.process = function(buffer) {
	const freqs = this.frequencies;

	let resampled = this.resampled;
	for (let j = 0, jl = buffer.length, k = 0; j < jl; j += downSampling, k++) {
		let sample = buffer[j]
		let sampleIndex = j;
		let bufferSize = jl;
		// hamming
		// exactBlackman
		// down sample

		// resampled[k] = sample * (0.426591 - 0.496561 * Math.cos(2 * Math.PI * sampleIndex/bufferSize) + 0.076848 * Math.cos(4 * Math.PI * sampleIndex/bufferSize))
		resampled[k] = sample;
	}

	for (let i = 0, il = freqs.length; i < il; i++) {
		let q1 = 0;
		let q2 = 0;

		let coeff = this.coeff[i];
		let cosine = this.cosine[i];
		let sine = this.sine[i];

		for (let j = 0, jl = resampled.length; j < jl; j++) {
			let q0 = coeff * q1 - q2 + resampled[j]
			q2 = q1;
			q1 = q0;
		}

		// basic Goertzel
		let real = q1 - q2 * cosine
		let imag = q2 * sine
		// let magnitude2 = real * real + imag * imag;
		// this.real[i] = real;
		// this.imag[i] = imag;
		// this.powers[i] = Math.sqrt(magnitude2);

		// optimized Goertzel
		let magnitude2 = q1 * q1 + q2 * q2 - q1 * q2 * coeff;
		this.powers[i] = Math.sqrt(magnitude2);
	}
}

var chunkSize = 8192; // 8 2048 4096 8192 16384
var sampleRate = 44100;
var downSampling = 1;

var gf = new GF(frequencies, sampleRate / downSampling, chunkSize / downSampling);

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

	// var SMOOTHING = 0.0;
	// var FFT_SIZE = 8192; // 2048 4096 8192 16384 32768

	this.sampleRate = options.sampleSize || chunkSize;
	this.decRange = [-80.0, 80.0];

	this.filename = filename;
	this.context = context = new AudioContext();
	console.log('Sample Rate', context.sampleRate);
	this.javascriptNode = context.createScriptProcessor(this.sampleRate, 1, 1);

	this.powers = gf.powers;

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
	if (!this.isPlaying) return;

	window.e = e;

	var sample = e.inputBuffer.getChannelData(0);
	s = sample;

	gf.process(sample);

	// console.log(r);

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
	} else {
		this.startTime = this.context.currentTime;
		this.count = 0;
		this.curSec = 0;
		this.curDuration = 0;
		this.source = this.context.createBufferSource();
		this.source.buffer = this.buffer;
		// this.analyser.buffer = this.buffer;
		this.javascriptNode.onaudioprocess = this.process.bind(this);

		// Connect graph
		this.source.connect(this.javascriptNode);
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

