const { default: axios } = require("axios");
const express = require("express");

const app = express();
const port = 3000;

// Parse JSON requests
app.use(express.json());

// Handle Razorpay webhook events
app.post("/razorpay-webhook", async (req, res) => {
  const body = req.body;

  // Verify webhook signature (optional but recommended)
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
      // Extract email and phone from Razorpay payload
      const email = extractEmailFromRazorpayPayload(body);
      const phone = extractPhoneFromRazorpayPayload(body);

      const response = await axios.post(
        "https://app.groove.cm/groovemail/embed/app.js",
        {
          email,
          phone,
          // Add any other form fields as needed
        }
      );

      console.log(response);

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

// Function to extract email from Razorpay payload
function extractEmailFromRazorpayPayload(razorpayPayload) {
  // Modify this function based on your actual Razorpay payload structure
  return razorpayPayload.payload.payment.entity.email;
}

// Function to extract phone from Razorpay payload
function extractPhoneFromRazorpayPayload(razorpayPayload) {
  // Modify this function based on your actual Razorpay payload structure
  return razorpayPayload.payload.payment.entity.phone;
}
