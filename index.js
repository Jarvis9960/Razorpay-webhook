const { default: axios } = require("axios");
const express = require("express");
const client = require("@sendgrid/client");

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
    console.log("Webhook signature mismatch");
    return res.status(400).send("Webhook signature mismatch");
  }

  const paymentPageId = "pl_N1SCeHSVOFclne";

  console.log(body)
  if (body.payload.payment.entity.notes.payment_page_id !== paymentPageId) {
    // Not the desired payment page ID, ignore the webhook
    console.log("Webhook received but not processed for this payment page")
    return res
      .status(200)
      .send("Webhook received but not processed for this payment page");
  }

  // Handle the webhook event based on the 'event' attribute in the request body
  switch (body.event) {
    case "payment.captured":
      // Handle payment captured event
      // Extract email and phone from Razorpay payload
      const email = extractEmailFromRazorpayPayload(body);
      const phone = extractPhoneFromRazorpayPayload(body);

      const data = {
        contacts: [
          {
            email: email,
          },
        ],
        list_ids: ["1a7d5737-dd07-4ede-ac4b-3dc60638fa6a"], // Replace with your actual list ID
      };

      const request = {
        method: "PUT",
        url: `/v3/marketing/contacts`,
        body: data,
      };

      try {
        const [response, body] = await client.request(request);

        console.log(response.statusCode, body);
      } catch (error) {
        console.error("SendGrid API request error:", error);
        return res.status(500).send("Error processing webhook");
      }

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
