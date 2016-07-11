const MULTITONES = 6;
const TOTALNOTES = 96 * MULTITONES;

function indexToFreq(index) {
	var diff = 39 * MULTITONES - index;
	return Math.pow( 2, diff / 12 / MULTITONES ) * 440;
}
