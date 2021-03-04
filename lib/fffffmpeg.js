exports.convertStringToSeconds = function(trim) {
  let seconds = 0;
  let time = trim.split(":");

  seconds += parseInt(time[0]) * 3600; // Hour
  seconds += parseInt(time[1]) * 60;   // Minutes
  seconds += parseInt(time[2]);        // Seconds

  return seconds;
}

exports.getTrimLength = function(trim) {
  return this.convertStringToSeconds(trim.end) -
    this.convertStringToSeconds(trim.start);
}

exports.generateTrimFilter = function(trim, index) {
  return "[0:v]trim=start=" +
    this.convertStringToSeconds(trim.start) +
    ":end=" +
    this.convertStringToSeconds(trim.end) +
    ",setpts=PTS-STARTPTS[tv" + index + "]; " +
    "[tv" + index + "]settb=AVTB[v" + index + "]; \\\n"
}

exports.generateaTrimFilter = function(trim, index, startDelta) {
  return "[0:a]atrim=start=" +
    (this.convertStringToSeconds(trim.start) + startDelta) +
    ":end=" +
    this.convertStringToSeconds(trim.end) +
    ",asetpts=PTS-STARTPTS[a" + index + "]; \\\n"
}

exports.generateOpeningCredits = function(data) {
  let background = "color=c=black:s=" + data.resolution + ":r=24:d=4[i0];\\\n";
  let productionText = "[i0]drawtext=\\\n" +
    "text='" + data.openingCredits.production + "': \\\n" +
    "x=(w-text_w)/2:y=(h-text_h)/2: \\\n" +
    "fontfile=OpenSans.ttf:\\\n" +
    "fontsize=30:\\\n" +
    "fontcolor=FD7000[i0];\\\n"

  return background + productionText;
}

exports.generateFFMPEG = function(data) {
  let command = "../new_ffmpeg/ffmpeg -i " + 
    data.inputFile + 
    " -i " + data.inputLogo +
    ' -filter_complex "\\\n';

  // Generate Trims filters
  for (let i = 0; i < data.trims.length; i++) {
    command += this.generateTrimFilter(data.trims[i], i)
    command += this.generateaTrimFilter(data.trims[i], i, i === 0 ? 0: 1)
  }

  // Generate XFade transitions
  let lastXFadeName = ""
  let lastTrimLength = this.getTrimLength(data.trims[0]) - 1;
  command += "[v0][v1]xfade=transition=fade:duration=1:offset=" +
    lastTrimLength +
    "[x1]; \\\n";

  for (let i = 1; i < data.trims.length -1; i++) {
    let currentTrimLength = this.getTrimLength(data.trims[i]) - 1;
    command += "[x" + i + "][v" + (i + 1) + "]" +
      "xfade=transition=fade:duration=1:offset=" +
      (currentTrimLength + lastTrimLength) +
      "[x" + ( i + 1) + "]; \\\n"

    lastTrimLength += currentTrimLength;
  }

  // Generate the Logo overlay
  command += "[1:v]scale=100:100 [o0]; \\\n"
  command += "[x" + (data.trims.length - 1) + "]" +
    "[o0]overlay=(W-100-20):(H-100-20)[o1]; \\\n"

  // Generate Intro
  command += this.generateOpeningCredits(data);
  command += "[i0]settb=AVTB[i1];\\\n";
  command += "[i1][o1]xfade=transition=horzopen:duration=2:offset=2[outv]; \\\n";

  // Generate Audio Concat
  for (let i = 0; i < data.trims.length; i++) {
    command += "[a" + i + "]";
  }
  command += "concat=n=" + data.trims.length + ":v=0:a=1[outa]\"\\\n";

  // Map streams
  command += " -map \"[outv]\"" +
    " -map \"[outa]\" " + data.outputFile;

  return command;
}
