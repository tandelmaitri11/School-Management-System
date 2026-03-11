const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const controller = require("../controller/announcementController");

const uploadDir = path.join(__dirname, "..", "uploads", "announcements");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (String(file.mimetype || "").startsWith("image/") || String(file.mimetype || "").startsWith("video/")) {
      return cb(null, true);
    }
    return cb(new Error("Only image/video files are allowed"));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/", upload.single("media"), controller.createAnnouncement);
router.get("/", controller.listAnnouncements);
router.get("/published", controller.getPublishedAnnouncements);
router.put("/:id", upload.single("media"), controller.updateAnnouncement);
router.delete("/:id", controller.deleteAnnouncement);
router.patch("/:id/publish", controller.togglePublishAnnouncement);

module.exports = router;
