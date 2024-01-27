const child_process = require("child_process");
const getPixels = require("get-pixels");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "./data/data.txt");

const toFourDigits = (string) => {
	while (string.length <= 3) {
		string = "0" + string;
	}
	return string;
};

const extractAllFrames = () => {
	return new Promise((resolve, reject) => {
    if (!fs.existsSync("./frames")) {
      fs.mkdirSync("./frames");
    }
  
    try {
      const command = "ffmpeg -i res/BadApple.mp4 -s 120x90 frames/BadApple%04d.png";
      const p = child_process.exec(command);
  
      p.stdout.pipe(process.stdout);
      p.stderr.pipe(process.stderr);

      p.on("exit", () => {
        resolve();
      })
    } catch (e) {
      console.log(e.code);
      console.log(e.message);
    }
  })
};

const build = (index) => {
	if (fs.existsSync(dataPath)) {
		fs.writeFileSync(dataPath, "", { flag: "w" }, (err) => {});
	}

	doFrame(index);
};

function doFrame(index = 1) {
	let indexString = toFourDigits(index.toString());
	let path = `frames/BadApple${indexString}.png`;

  fs.existsSync(path) || process.exit(0);

	getPixels(path, (err, pixels) => {
		if (err) {
			console.error(err);
			return;
		}

		let string = "";

		const symbols = "⠀⠃⠇⠏⠟⠿";

		let widthCounter = 0;
		for (let i = 0; i < pixels.data.length; i += 4) {
			let value = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
			value = Math.max(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);

			// string += getCharacterForGrayScale(value) + getCharacterForGrayScale(value);
			const index = Math.floor(value / (256 / 6));
			string += symbols[index].repeat(2);

			widthCounter++;
			if (widthCounter === 120) {
				widthCounter = 0;
				string += "\n";
			}
		}
		string += "\n";
		const regexes = [/(⠀+)/g, /(⠃+)/g, /(⠇+)/g, /(⠏+)/g, /(⠟+)/g, /(⠿+)/g];
		for (let i = 0; i < regexes.length; i++) {
			const matches = string.match(regexes[i]) || [];
			for (let match of matches) {
				string = string.replace(match, symbols[i] + toFourDigits(match.length.toString()));
			}
		}

		fs.writeFileSync(dataPath, string, { flag: "a" }, (err) => {});

		console.log(`Frame ${index} done.`);

		setTimeout(() => doFrame(index + 1), 0);
	});
}

extractAllFrames().then(() => {
  build(1);
})