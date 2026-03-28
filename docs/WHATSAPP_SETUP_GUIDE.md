# WhatsApp TaxGPT — Meta Developer Account Setup Guide

Follow these steps to connect your business WhatsApp number to the TaxGPT bot.

## Prerequisites

- A Facebook account (personal is fine — it won't be public)
- Your business phone number (must be able to receive SMS or voice call for verification)
- A Meta Business Suite / Business Manager account at [business.facebook.com](https://business.facebook.com)

---

## Step 1: Create a Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **Get Started** and log in with your Facebook account
3. Accept the developer terms and verify your account

## Step 2: Create a New App

1. In the Meta Developer Dashboard, click **Create App**
2. Select app type: **Business**
3. Fill in:
   - **App Name**: `AG FinTax TaxGPT`
   - **App Contact Email**: your business email
   - **Business Account**: select your Meta Business account (or create one)
4. Click **Create App**

## Step 3: Add the WhatsApp Product

1. On your app dashboard, scroll to **Add Products to Your App**
2. Find **WhatsApp** and click **Set Up**
3. Follow the prompts to connect your Meta Business account

## Step 4: Register Your Business Phone Number

1. Navigate to **WhatsApp** > **API Setup** in the left sidebar
2. Under **Step 5: Add a phone number**, click **Add phone number**
3. Enter your business phone number
4. Choose verification method: **SMS** or **Voice call**
5. Enter the verification code you receive
6. Once verified, note down the **Phone Number ID** displayed on the API Setup page

## Step 5: Generate a Permanent Access Token

The temporary token on the API Setup page expires in 24 hours. You need a permanent one:

1. Go to [business.facebook.com](https://business.facebook.com) > **Settings** > **Users** > **System Users**
2. Click **Add** to create a new system user:
   - **Name**: `TaxGPT Bot`
   - **Role**: Admin
3. Click **Add Assets**, select your WhatsApp app, and grant **Full Control**
4. Click **Generate New Token**:
   - Select your app (`AG FinTax TaxGPT`)
   - Enable permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Click **Generate Token**
5. **Copy and save this token securely** — this is your `WHATSAPP_ACCESS_TOKEN`

## Step 6: Choose a Verify Token

Create a secret string that only you know. This is used to verify the webhook connection.

Example: `agfintax-taxgpt-2026`

This will be your `WHATSAPP_VERIFY_TOKEN`.

## Step 7: Configure the Webhook

1. In your Meta Developer App, go to **WhatsApp** > **Configuration**
2. Under **Webhook**, click **Edit**
3. Enter:
   - **Callback URL**: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/whatsapp/webhook`
   - **Verify Token**: the string from Step 6 (e.g., `agfintax-taxgpt-2026`)
4. Click **Verify and Save**
5. Under **Webhook Fields**, subscribe to: **`messages`**

> **Note**: The webhook endpoint must be live before you can verify. Deploy the app to Vercel first (see deployment section).

## Step 8: Collect Your Environment Variables

You should now have these three values:

| Variable | Where to Find It |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Step 5 — System User permanent token |
| `WHATSAPP_PHONE_NUMBER_ID` | Step 4 — WhatsApp API Setup page |
| `WHATSAPP_VERIFY_TOKEN` | Step 6 — your custom secret string |

Add these to your `.env.local` file and Vercel dashboard environment variables.

---

## Testing

1. Deploy the app to Vercel
2. Configure the webhook URL (Step 7)
3. Send a message from your personal WhatsApp to your business number
4. You should see TaxGPT reply within a few seconds

## Troubleshooting

- **Webhook verification fails**: Ensure the app is deployed and the URL is correct. Check Vercel function logs.
- **Messages not arriving**: Confirm you subscribed to the `messages` webhook field.
- **Bot doesn't reply**: Check Vercel function logs for errors. Verify `WHATSAPP_ACCESS_TOKEN` is valid.
- **Token expired**: If using a temporary token, switch to a permanent System User token (Step 5).
