#!/usr/bin/env node

const yargs = require('yargs');
const fffffmpeg = require('./lib/fffffmpeg');

yargs
.command({
  command: 'render',
  describe: 'Renders a video',
  builder: {
    input: {
      describe: 'Movie input (*.mp4) 1920x1080',
      // demandOption: true,
      type: 'string'
    },
    logo: {
      describe: 'Logo overlay (*.png)',
      type: 'string'
    },
    config: {
      describe: 'JSON Config file (see data/default.json)',
      default: './data/default.json',
      type: 'string'
    },
  },

  handler(argv) {
    const config = require(argv.config);
    config.inputFile = argv.input || config.inputFile;
    config.inputLogo = argv.logo || config.inputLogo;

    const ffmpegOptions = fffffmpeg.generateFFMPEG(config);
    const command = `yes | ./bin/ffmpeg/ffmpeg ${ffmpegOptions}`;

    console.log(command);
  }
})
.alias('i', 'input')
.alias('l', 'logo')
.alias('f', 'config')
.nargs('i', 1)

yargs.parse()
