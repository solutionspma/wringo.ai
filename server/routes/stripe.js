import { Router } from "express";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.get("/test", (req, res) => res.json({ok: true, message: "Stripe routes loaded"}));

router.post("/checkout", async (req, res) => {
  try {
    console.log("[Checkout] Request body:", req.body);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{price: req.body.priceId, quantity: 1}],
      success_url: "https://wringoai.com/success",
      cancel_url: "https://wringoai.com/pricing"
    });
    res.json({url: session.url});
  } catch (err) {
    console.error("[Checkout Error]", err.message);
    res.status(500).json({error: err.message});
  }
});

export default router;
