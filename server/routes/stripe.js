import { Router } from "express";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{price: req.body.priceId, quantity: 1}],
    success_url: "https://wringoai.com/success",
    cancel_url: "https://wringoai.com/pricing"
  });
  res.json({url: session.url});
});

export default router;
