import express from "express";

const router = express.Router();

// GPU WORKER POSTS RESULTS HERE
router.post("/job-complete", async (req, res) => {
  const { job_id, result_url } = req.body;

  console.log("JOB COMPLETE:", job_id, result_url);

  res.json({ status: "ok" });
});

export default router;
