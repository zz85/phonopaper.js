// This is a script processor version of simple microtone synthesizer
// It was originally written using Oscillator Nodes, however,
// they seem to be slightly less performant than a single script processor
// Script Processor however does suffer from gitches from latency using
// small buffer sizes

'use strict';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const notesOn = new Array(TOTALNOTES).fill(0);
const frequencies = notesOn.map( (_, i) => indexToFreq(i) );
const audioCtx = new AudioContext();

// Create a ScriptProcessorNode with a bufferSize of 1024 2048 4096 8192 and a single input and output channel
const scriptNode = audioCtx.createScriptProcessor(4096, 0, 1);

let x = 0;

const sample_rate = audioCtx.sampleRate;
console.log('bufferSize', scriptNode.bufferSize, 'sample_rate', sample_rate);

scriptNode.onaudioprocess = function(audioProcessingEvent) {
	// The input buffer is the song we loaded earlier
	var inputBuffer = audioProcessingEvent.inputBuffer;

	// The output buffer contains the samples that will be modified and played
	var outputBuffer = audioProcessingEvent.outputBuffer;

	// Loop through the output channels (in this case there is only one)
	for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
		var outputData = outputBuffer.getChannelData(channel);

		// Loop through the 4096 samples
		for (var sample = 0; sample < outputData.length; sample++) {
			x++;
			let v = 0

			for (var i = 0; i < TOTALNOTES; i++) {
				if (notesOn[i])
					v += Math.sin( x / sample_rate * frequencies[i] * 2 * Math.PI );
			}

			outputData[sample] = v;
			// let target_freq = 440;
			// Math.sin( x / sample_rate * (target_freq * 2 * Math.PI ))
			// LOLs I actually did comment on http://0xfe.blogspot.sg/2011/08/generating-tones-with-web-audio-api.html
		}
	}
}

function startSynthesier() {
	scriptNode.connect(audioCtx.destination);
}

function stopSynthesier() {
	scriptNode.disconnect(audioCtx.destination);
}

startSynthesier();