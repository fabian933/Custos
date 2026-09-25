pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Proves, without revealing `value`, that:
//   Poseidon(value, salt) == commitment
//   value < threshold        when mode == 0   (salary_below)
//   value >= threshold       when mode == 1   (age_at_least)
template RangeClaim(nBits) {
    signal input value;
    signal input salt;

    signal input commitment;
    signal input threshold;
    signal input mode;

    mode * (mode - 1) === 0;

    component hash = Poseidon(2);
    hash.inputs[0] <== value;
    hash.inputs[1] <== salt;
    hash.out === commitment;

    component below = LessThan(nBits);
    below.in[0] <== value;
    below.in[1] <== threshold;
    below.out === 1 - mode;
}

component main {public [commitment, threshold, mode]} = RangeClaim(64);
