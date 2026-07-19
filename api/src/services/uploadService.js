const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { Readable } = require("stream");
const csv = require("csv-parser");
const mongoose = require("mongoose");

const makeDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const singleUpload = (file, folder) => {
  if (!file) throw "Please upload a valid file.";
  return { filePath: `${folder}/` + file.filename, fileName: file.filename };
};

const multipleUpload = (files, folder) => {
  if (!files || files.length === 0)
    throw "Please upload at least one valid file.";
  return files.map((f) => ({
    filePath: `${folder}/` + f.filename,
    fileName: f.filename,
  }));
};

exports.uploadImage = (file) => singleUpload(file, "img");
exports.uploadMultipleImages = (files) => multipleUpload(files, "img");
exports.uploadDocument = (file) => singleUpload(file, "document");
exports.uploadVideo = (file) => singleUpload(file, "video");
exports.uploadAudio = (file) => singleUpload(file, "audios");
exports.uploadDocuments = (files) => multipleUpload(files, "document");

exports.uploadBase64Image = (imageBase64) => {
  if (!imageBase64) throw "No image data provided.";
  const matches = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) throw "Invalid base64 image format.";

  const ext = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const randomSuffix = Math.floor(Math.random() * 10000);
  const fileName = `image-${Date.now()}-${randomSuffix}.${ext}`;

  const imgDir = path.join(__dirname, "../../public/img");
  makeDir(imgDir);
  fs.writeFileSync(path.join(imgDir, fileName), buffer);

  return { filePath: "img/" + fileName, fileName };
};
