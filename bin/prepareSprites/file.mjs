import axios from "axios";
import fs from "fs";
import url from "url";

const BASE_URL = "https://adventure.land";

export const ensureFolderExists = (path) => {
  // Split the file path into an array of directories
  const dirs = path.split("/");

  // Remove the file name from the array
  dirs.pop();

  let currentDir = ".";

  // Create the directories if they don't exist
  for (const dir of dirs) {
    currentDir += "/" + dir;
    try {
      fs.mkdirSync(currentDir);
    } catch (err) {
      if (err.code !== "EEXIST") {
        console.debug(path);
        throw err;
      }
    }
  }
};

export const downloadSkin = async (data) => {
  const originalFilename = `./original${url.parse(data.file).pathname}`;
  const overrideFilename = `./overrides${url.parse(data.file).pathname}`;

  ensureFolderExists(originalFilename);

  if (fs.existsSync(overrideFilename)) {
    // We have an override for this file
    console.debug(`Overriding ${originalFilename}...`);
    fs.copyFileSync(overrideFilename, originalFilename);
  }
  if (!fs.existsSync(originalFilename)) {
    // The file doesn't exist, download it
    console.debug(`Downloading ${originalFilename}...`);
    const response = await axios({
      url: `${BASE_URL}${data.file}`,
      method: "GET",
      responseType: "arraybuffer",
    });
    fs.writeFileSync(originalFilename, response.data);
  }

  return originalFilename;
};
