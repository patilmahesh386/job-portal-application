const express=require('express');
const router=express.Router()
const controller=require("../controllers/application.controller")
const { generateToken, jsonAuthentication} =require('../config/jwt')

router.post("/jobs/apply/:jobId",jsonAuthentication, controller.postApplication)

router.get("/jobs/apply/:jobId",jsonAuthentication, controller.getAppliedCandidate)

router.get("/jobs/applied/:userId", jsonAuthentication, controller.getCandidatesJobs);

router.delete("/jobs/candidates/:applicationId",jsonAuthentication, controller.deleteCandidatesJob )

router.put("/jobs/updatestatus/:applicationId", jsonAuthentication, controller.updateStatus)

module.exports=router;