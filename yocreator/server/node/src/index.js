import express from "express";
import cors from "cors";
import renderRouter from "./routes/render.js";
import jobsRouter from "./routes/jobs.js";
import webhookRouter from "./routes/webhook.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/render", renderRouter);
app.use("/jobs", jobsRouter);
app.use("/webhook", webhookRouter);

app.listen(5001, () => console.log("NODE API RUNNING 5001"));
