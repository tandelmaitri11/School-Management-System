const sendSms = async ({ to, message }) => {
  const target = String(to || "").trim();
  const body = String(message || "").trim();
  if (!target || !body) {
    throw new Error("SMS requires both to and message");
  }

  const smsProvider = String(process.env.SMS_PROVIDER || "").trim().toLowerCase();
  const msg91AuthKey = String(process.env.MSG91_AUTH_KEY || "").trim();
  const msg91FlowId = String(process.env.MSG91_FLOW_ID || "").trim();
  const msg91Sender = String(process.env.MSG91_SENDER || "").trim();
  const msg91CountryCode = String(process.env.MSG91_COUNTRY_CODE || "91").trim();
  const msg91MessageVar = String(process.env.MSG91_MESSAGE_VAR || "message").trim();

  if (smsProvider === "msg91") {
    if (!msg91AuthKey || !msg91FlowId) {
      throw new Error("MSG91 requires MSG91_AUTH_KEY and MSG91_FLOW_ID");
    }

    const recipient = {
      mobiles: `${msg91CountryCode}${target}`,
      [msg91MessageVar]: body,
    };

    if (msg91Sender) {
      recipient.sender = msg91Sender;
    }

    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: msg91AuthKey,
      },
      body: JSON.stringify({
        flow_id: msg91FlowId,
        recipients: [recipient],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`MSG91 failed (${res.status}): ${txt || "unknown error"}`);
    }

    return { mocked: false, provider: "msg91" };
  }

  const providerUrl = String(process.env.SMS_PROVIDER_URL || "").trim();
  const providerToken = String(process.env.SMS_PROVIDER_TOKEN || "").trim();

  // Fallback behavior: log to server so queue flow can still be tested.
  if (!providerUrl) {
    console.log(`[sms-mock] to=${target} message=${body}`);
    return { mocked: true };
  }

  const res = await fetch(providerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(providerToken ? { Authorization: `Bearer ${providerToken}` } : {}),
    },
    body: JSON.stringify({ to: target, message: body }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SMS provider failed (${res.status}): ${txt || "unknown error"}`);
  }

  return { mocked: false };
};

module.exports = { sendSms };
