const { default: axios } = require("axios");
const express = require("express");
const client = require("@sendgrid/mail");
client.setApiKey(
  "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"
);

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

      // SendGrid API request to add contact to a list
      const listId = "1a7d5737-dd07-4ede-ac4b-3dc60638fa6a";

      const response = await client.request({
        method: "PUT",
        url: `/v3/marketing/lists/${listId}/contacts/${email}`,
        body: {
          list_ids: [listId],
        },
      });

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

// 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

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
