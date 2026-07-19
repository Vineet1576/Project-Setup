const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const uploadCtrl = require("../controllers/uploadController");

const makeDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/img");
    makeDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const extMap = {
      "image/gif": "gif",
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    const ext = extMap[file.mimetype] || "jpg";
    cb(null, `image-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`);
  },
});
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/document");
    makeDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `document-${Date.now()}.${file.mimetype.split("/")[1]}`),
});
const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/video");
    makeDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `video-${Date.now()}.${file.originalname.split(".").pop()}`),
});
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/audios");
    makeDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `audio-${Date.now()}.${file.originalname.split(".").pop()}`),
});
const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const multiDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/document");
    makeDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const extMap = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "image/jpeg": "jpg",
      "image/png": "png",
      "text/plain": "txt",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
    };
    const ext = extMap[file.mimetype];
    if (!ext) return cb(new Error("Unsupported file type"));
    cb(null, `doc-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`);
  },
});
const uploadMultiDoc = multer({
  storage: multiDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/image", uploadImage.single("file"), uploadCtrl.uploadImage);
router.post("/image-base64", uploadCtrl.uploadBase64Image);
router.post("/document", uploadDoc.single("file"), uploadCtrl.uploadDocument);
router.post(
  "/multiple-images",
  uploadImage.array("files"),
  uploadCtrl.uploadMultipleImages,
);
router.post("/video", uploadVideo.single("file"), uploadCtrl.uploadVideo);
router.post("/audio", uploadAudio.single("file"), uploadCtrl.uploadAudio);
router.post(
  "/multiple/documents",
  uploadMultiDoc.array("files"),
  uploadCtrl.uploadMultipleDocuments,
);

module.exports = router;
