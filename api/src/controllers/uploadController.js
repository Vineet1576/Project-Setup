const uploadService = require("../services/uploadService");

module.exports = {
  uploadImage: (req, res, next) => {
    try {
      const result = uploadService.uploadImage(req.file);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  uploadBase64Image: async (req, res, next) => {
    try {
      const { imageBase64 } = req.body;
      const result = uploadService.uploadBase64Image(imageBase64);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  uploadDocument: (req, res, next) => {
    try {
      const result = uploadService.uploadDocument(req.file);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  uploadMultipleImages: (req, res, next) => {
    try {
      const files = uploadService.uploadMultipleImages(req.files);
      return res.json({ success: true, files });
    } catch (err) {
      next(err);
    }
  },

  uploadVideo: (req, res, next) => {
    try {
      const result = uploadService.uploadVideo(req.file);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  uploadAudio: (req, res, next) => {
    try {
      const result = uploadService.uploadAudio(req.file);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  uploadMultipleDocuments: (req, res, next) => {
    try {
      const fileDetails = uploadService.uploadDocuments(req.files);
      return res.status(200).json({
        success: true,
        message: "Documents uploaded successfully",
        fileDetails,
      });
    } catch (err) {
      next(err);
    }
  },
};
