const express = require("express");
const router = express.Router();
const controller = require("../controllers/jobPost.controller");
const { jsonAuthentication } = require("../config/jwt");
const validate = require("../middleware/validate");
const jobSchema = require("../validation/jobValidation");

router.get("/jobs", controller.getPost);
router.get("/jobs/:id", controller.getById);
router.get("/jobs/details/:jobId", jsonAuthentication, controller.getJobsByJobId);
router.post("/jobs", jsonAuthentication, validate(jobSchema), controller.createPost);
router.put("/jobs/:id", controller.updateJob);

module.exports = router;