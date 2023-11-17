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

async function submitToGrooveForm(email, phone) {
  const grooveFormEndpoint =
    "https://v1.gdapis.com/api/groovemail/saveuserdetails";
  const grooveFormApiKey = "d87Sx6volv5yNs0TpG7213z59r3U2WXF"; // Replace with your Groove Form API key

  try {
    // Step 1: Simulate a request to get the initial HTML form
    const initialResponse = await axios.get(grooveFormEndpoint);
    const csrfToken = extractCsrfToken(initialResponse.data);

    // Step 2: Simulate a request to submit the form with email and phone
    const submitResponse = await axios.post(
      grooveFormEndpoint,
      {
        _token: csrfToken,
        email: email,
        phone_number: phone,
        // Add any additional parameters required by the form for submission
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Set the correct content type
          Authorization: `Bearer ${grooveFormApiKey}`,
        },
      }
    );

    console.log("Groove Form API response:", submitResponse.data);
  } catch (error) {
    console.error(
      "Error submitting to Groove Form:",
      error.response ? error.response.data : error.message
    );
  }
}

function extractCsrfToken(html) {
  // Implement a function to extract the CSRF token from the HTML
  // This may involve using a library like cheerio or regular expressions
  // Replace the implementation based on the actual HTML structure
  const match = html.match(/<input type="hidden" name="_token" value="(.+?)">/);
  return match ? match[1] : null;
}
