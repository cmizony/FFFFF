#!/usr/bin/env node

const yargs = require('yargs/yargs');
const fffffmpeg = require('./lib/fffffmpeg');
const data = require('./data/default.json');

console.log(fffffmpeg.generateFFMPEG(data));
