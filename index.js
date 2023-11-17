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

      // Submit to Groove email form
      await submitToGrooveForm(email, phone);

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

// Function to submit to Groove email form
async function submitToGrooveForm(email, phone) {
  const grooveFormEndpoint =
    "https://v1.gdapis.com/api/groovemail/saverawuserdetails";
  const grooveFormApiKey = "d87Sx6volv5yNs0TpG7213z59r3U2WXF"; // Replace with your Groove Form API key

  try {
    const response = await axios.post(
      grooveFormEndpoint,
      {
        email: email,
        phone_number: phone, // Make sure this matches the field name in your Groove form
        // Add any additional parameters required by Groove form for submission
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${grooveFormApiKey}`,
        },
      }
    );

    console.log("Groove Form API response:", response.data);
  } catch (error) {
    console.error(
      "Error submitting to Groove Form:",
      error
    );
  }
}
