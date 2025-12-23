import express from "express";

const router = express.Router();

router.post("/inbound", async (req, res) => {
  const body = req.body;
  const eventType = body?.data?.event_type;
  const payload = body?.data?.payload;

  const callControlId = payload?.call_control_id;

  if (!eventType) {
    return res.sendStatus(200);
  }

  if (eventType === "call.initiated" && callControlId) {
    return res.json({
      data: {
        commands: [{ command: "answer", call_control_id: callControlId }],
      },
    });
  }

  if (eventType === "call.answered" && callControlId) {
    const publicWsUrl = process.env.TELNYX_MEDIA_WS_URL;

    if (!publicWsUrl) {
      console.log("TELNYX_MEDIA_WS_URL is not set; call will stay answered only.");
      return res.sendStatus(200);
    }

    return res.json({
      data: {
        commands: [
          {
            command: "start_stream",
            call_control_id: callControlId,
            stream_url: publicWsUrl,
            stream_track: "both",
          },
        ],
      },
    });
  }

  return res.sendStatus(200);
});

export default router;
