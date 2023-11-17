const express = require("express");

const app = express();
const port = 3000;

// Parse JSON requests
app.use(express.json());

// Handle Razorpay webhook events
app.post("/razorpay-webhook", (req, res) => {
  const body = req.body;

  // Verify webhook signature (optional but recommended)
  // Replace 'your_webhook_secret' with your actual Razorpay webhook secret
  const razorpayWebhookSecret = "ANKITFUKTE";
  const generatedSignature = calculateWebhookSignature(
    body,
    razorpayWebhookSecret
  );

  if (generatedSignature !== req.get("x-razorpay-signature")) {
    // Signature mismatch, do not process the request
    return res.status(400).send("Webhook signature mismatch");
  }

  // Handle the webhook event based on the 'event' attribute in the request body
  switch (body.event) {
    case "payment.captured":
      // Handle payment captured event
      console.log("Payment Captured:", body.payload.payment.entity);
      break;
    // Add more cases for other events as needed
    default:
      console.log("Unhandled event:", body.event);
  }

  // Respond with a 200 OK to acknowledge receipt of the webhook
  res.status(200).send("Webhook received");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

// Function to calculate Razorpay webhook signature
function calculateWebhookSignature(body, secret) {
  const hmac = require("crypto").createHmac("sha256", secret);
  hmac.update(JSON.stringify(body));
  return hmac.digest("hex");
}
