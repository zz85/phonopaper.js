const MULTITONES = 2; // 6
const TOTALNOTES = 96 * MULTITONES;

function indexToFreq(index) {
	var diff = 39 * MULTITONES - index;
	return Math.pow( 2, diff / 12 / MULTITONES ) * 440;
}

// indexToFreq(TOTALNOTES)
// 16.351597831287414

// indexToFreq(0)
// 4186.009044809578

const frequencies = [];

for (let i = 0; i < TOTALNOTES; i++) {
	frequencies.push(indexToFreq(i));
}
