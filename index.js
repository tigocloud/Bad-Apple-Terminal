const gameloop = require("node-gameloop");
const readline = require("readline");
const fs = require("fs");

const jpLyrics = fs.readFileSync("jp.txt", "utf8").split("\n");
const cnLyrics = fs.readFileSync("cn.txt", "utf8").split("\n");

const getLyrics = (time) => {
  let jp = ''
  let cn = ''

  for (const line of jpLyrics) {
    let [timestamp, lyric] = line.split(']').map((s) => s.trim().replace('[', ''))
    let [min, sec] = timestamp.split(':').map((s) => parseInt(s))
    timestamp = min * 60 + sec

    if (timestamp <= time) {
      jp = lyric
    } else {
      break
    }
  }

  for (const line of cnLyrics) {
    let [timestamp, lyric] = line.split(']').map((s) => s.trim().replace('[', ''))
    let [min, sec] = timestamp.split(':').map((s) => parseInt(s))
    timestamp = min * 60 + sec

    if (timestamp <= time) {
      cn = lyric
    } else {
      break
    }
  }

  return [jp, cn]
}

const width = process.stdout.columns;
const height = process.stdout.rows - 2;
const heightRatio = Math.floor(Math.max(90 / height, 1));
const widthRatio = Math.max(240 / width, 1);

function decompressFrame(frame) {
  let string = "";
  let lines = frame.split("\n");

  for (const index in lines) {
    if (index % heightRatio !== 0) {
      continue;
    }
    let line = lines[index];
    let tokens = line.match(/.{1,5}/g);
    let CurrentLine = "";
    for (let token of tokens) {
      let multiplier = parseInt(token.substring(1));
      char = token[0].repeat((multiplier / widthRatio)|0);
      CurrentLine += char;
    }
    string += `${CurrentLine.substring(0, width)}\n`
  }

  return string;
}

const calculateTextLength = (text) => {
  let length = 0;
  for (const char of text) {
    if (char.match(/[\u4e00-\u9fa5]|[\u0800-\u4e00]|[\uff00-\uffff]/)) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length;
}

function run() {
  const data = fs.readFileSync("data.txt", "utf8");

  let frames = data.split("\n\n");

  let index = 0;
  const startTime = Date.now();
  gameloop.setGameLoop((delta) => {
    try {
      let string = decompressFrame(frames[index]);
      const time = (Date.now() - startTime) / 1000;
      const fps = `FPS: ${(index / ((Date.now() - startTime) / 1000)).toFixed(2)} / ${Math.floor(time/60)}:${(time%60).toFixed(2)}`
      const [jp, cn] = getLyrics(time)
      const width = process.stdout.columns;
      const halfWidth = Math.floor((width - fps.length) / 2)

      readline.clearLine(process.stdout, -1);
      readline.cursorTo(process.stdout, 0, 2);
      process.stdout.write(string);
      process.stdout.write(`${jp}${" ".repeat(halfWidth - calculateTextLength(jp))}${fps}${" ".repeat(halfWidth - calculateTextLength(cn))}${cn}\n`);
      
      index++;
    } catch (error) {
      gameloop.clearGameLoop();
    }
  }, 1000 / 30);
}

run();
