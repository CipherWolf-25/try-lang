MENSIFY — Maya Sandbox Authentication Fix

The previous 401 response means Maya received the request but rejected the API credentials.
This is not a frontend fetch failure. The bundled/default key was not valid for this request.

1. Open your Maya Business Manager / Developer Dashboard.
2. Switch to Sandbox/Test mode and copy your Sandbox PUBLIC API Key.
3. In the MENSIFY project folder, copy `.env.example` and rename the copy to `.env`.
4. Edit `.env` and replace the placeholder with your real Sandbox Public API Key:
   MAYA_PUBLIC_KEY=pk-your-real-sandbox-public-key
5. Save the file, stop the running server with Ctrl+C, then run:
   npm start
6. Try checkout again.

Important:
- Do not put your Secret API Key in browser JavaScript or share it in chat.
- Keep the key in `.env`; do not commit `.env` to public GitHub.
- If Maya still returns 401, verify you copied the Sandbox Public API Key (not Production key, not Secret key), and that your Maya account has Checkout Sandbox credentials enabled.
- This ZIP intentionally does not include a working API key because keys are account-specific.

Local test:
Open http://localhost:3000/api/maya/config
It should show `configured: true` after the `.env` key is loaded. This only confirms the variable exists; a real checkout request is the definitive authentication test.


Hosted Checkout behavior
------------------------
When the customer chooses Maya and places an order, `js/payment.js` calls `POST /api/maya/checkout`. The backend creates a Checkout session and the browser navigates to the `redirectUrl` returned by Maya. This is the official Maya-hosted payment page (card, wallet and other methods available to the Sandbox merchant). Do not hard-code a hosted checkout URL; use the URL returned for each created session.

The item payload includes both `amount` (unit price) and `totalAmount` (line total) in PHP. If Maya still rejects a request, inspect the `Maya Create Checkout failed:` log in the terminal and use the returned error details to resolve any merchant-specific requirements.
