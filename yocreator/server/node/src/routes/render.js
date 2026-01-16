import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/queue", async (req, res) => {
  const { user_id, type, payload } = req.body;

  const { data, error } = await supabase.rpc("add_render_job", {
    p_user_id: user_id,
    p_type: type,
    p_payload: payload
  });

  if (error) return res.json({ error });

  res.json({ job_id: data });
});

export default router;
