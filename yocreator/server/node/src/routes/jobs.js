import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// GET JOB STATUS
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("render_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.json({ error });
  res.json(data);
});

// GET ALL JOBS FOR USER
router.get("/user/:uid", async (req, res) => {
  const { uid } = req.params;

  const { data, error } = await supabase
    .from("render_jobs")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (error) return res.json({ error });
  res.json(data);
});

export default router;
