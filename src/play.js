const readline = require("readline");
const fs = require("fs");
const path = require("path");

const jpLyrics = fs.readFileSync(path.join(__dirname, "./data/jp.txt"), "utf8").split("\n");
const cnLyrics = fs.readFileSync(path.join(__dirname, "./data/cn.txt"), "utf8").split("\n");

class PrecisionTimer {
	count = 0;
	runTime;
	startTime;
	timeout;
	task;
	interval;
	t;

	constructor(task, interval, immediately = false) {
		this.task = task;
		this.interval = interval;

		this.startTime = performance.now();
		this.t = setTimeout(() => {
			this._run();
		}, this.interval);

		if (immediately) this._run();
	}

	async _run() {
		this.runTime = performance.now();
		++this.count;
		let time = this.runTime - (this.startTime + this.count * this.interval);

		if (typeof this.task?.then === "function") {
			await this.task();
		} else {
			this.task();
		}

		this.t = setTimeout(() => {
			this._run();
		}, this.interval - time);
	}

	cancel() {
		clearTimeout(this.t);
		this.t = null;
	}
}

const lyricIndex = {
	cn: 0,
	jp: 0,
};

const getLyrics = (time) => {
	let jp = "";
	let cn = "";

	for (let index = lyricIndex.jp; index < jpLyrics.length; index++) {
    const line = jpLyrics[index];
		let [timestamp, lyric] = line.split("]").map((s) => s.trim().replace("[", ""));
		let [min, sec] = timestamp.split(":").map((s) => parseInt(s));
		timestamp = min * 60 + sec;

		if (timestamp <= time) {
			jp = lyric;
		} else {
			break;
		}
	}

	for (let index = lyricIndex.cn; index < cnLyrics.length; index++) {
    const line = cnLyrics[index];
		let [timestamp, lyric] = line.split("]").map((s) => s.trim().replace("[", ""));
		let [min, sec] = timestamp.split(":").map((s) => parseInt(s));
		timestamp = min * 60 + sec;

		if (timestamp <= time) {
			cn = lyric;
		} else {
			break;
		}
	}

	return [jp, cn];
};

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
			char = token[0].repeat(Math.ceil(multiplier / widthRatio));
			CurrentLine += char;
		}
		string += `${CurrentLine.substring(0, width)}\n`;
	}

	return string;
}

const calculateTextLength = (text) => {
	// return text.replace(/[^\x00-\xff]/g, "**").length;

	// 这样速度真的更快，别用上面那个了，球球了
	let length = 0;
	for (const char of text) {
		if (char.match(/[^\x00-\xff]/)) {
			length += 2;
		} else {
			length += 1;
		}
	}
	return length;
};

function run() {
	const data = fs.readFileSync("data.txt", "utf8");

	let frames = data.split("\n\n");

	let index = 0;
	const startTime = Date.now();

	const timer = new PrecisionTimer(async () => {
		try {
			const start = Date.now();
			let string = decompressFrame(frames[index]);
			const time = (start - startTime) / 1000;
			const fps = `FPS: ${(index / ((start - startTime) / 1000)).toFixed(2)} / ${Math.floor(time / 60)}:${(
				time % 60
			).toFixed(2)} / ${process.stdout.rows}x${process.stdout.columns}`;
			const [jp, cn] = getLyrics(time);
			const halfWidth = Math.floor((width - fps.length) / 2);

			// readline.clearLine(process.stdout, -1);
			readline.cursorTo(process.stdout, 0, 0);
			process.stdout.write(string);
			process.stdout.write(
				`${jp}${" ".repeat(halfWidth - calculateTextLength(jp))}${fps}${" ".repeat(
					halfWidth - calculateTextLength(cn)
				)}${cn}`
			);

			index++;
		} catch (error) {
			// console.log(error);
			// process.exit(0);
      timer.cancel()
		}
	}, 1000 / 30);
}

run();
