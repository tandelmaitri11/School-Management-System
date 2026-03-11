const ContactMessage = require("../models/contactMessage");
const { sendEmail } = require("../utils/mailer");

const normalize = (v) => String(v || "").trim();

exports.submitContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body || {};

    if (!normalize(firstName) || !normalize(email) || !normalize(message)) {
      return res.status(400).json({
        success: false,
        message: "firstName, email and message are required",
      });
    }

    const doc = await ContactMessage.create({
      firstName: normalize(firstName),
      lastName: normalize(lastName),
      email: normalize(email).toLowerCase(),
      message: normalize(message),
    });

    const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.SMTP_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: "New Contact Message",
          html: `
            <h3>New Contact Message</h3>
            <p><b>Name:</b> ${doc.firstName} ${doc.lastName || ""}</p>
            <p><b>Email:</b> ${doc.email}</p>
            <p><b>Message:</b><br/>${doc.message}</p>
          `,
        });
      } catch (e) {
        console.error("Contact admin mail error:", e?.message || e);
      }
    }

    try {
      await sendEmail({
        to: doc.email,
        subject: "We received your message - SchoolY",
        html: `
          <p>Hello ${doc.firstName},</p>
          <p>Thank you for contacting SchoolY. We received your message and will respond soon.</p>
          <p><b>Your message:</b><br/>${doc.message}</p>
        `,
      });
    } catch (e) {
      console.error("Contact acknowledgement mail error:", e?.message || e);
    }

    return res.status(201).json({
      success: true,
      message: "Message submitted successfully",
      data: { id: doc._id },
    });
  } catch (error) {
    console.error("submitContactMessage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const { status = "", q = "" } = req.query || {};
    const query = {};

    if (normalize(status)) query.status = normalize(status);
    if (normalize(q)) {
      query.$or = [
        { firstName: { $regex: normalize(q), $options: "i" } },
        { lastName: { $regex: normalize(q), $options: "i" } },
        { email: { $regex: normalize(q), $options: "i" } },
        { message: { $regex: normalize(q), $options: "i" } },
      ];
    }

    const messages = await ContactMessage.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("getContactMessages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.respondContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status } = req.body || {};

    if (!normalize(response)) {
      return res.status(400).json({ success: false, message: "response is required" });
    }

    const doc = await ContactMessage.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    doc.adminResponse = normalize(response);
    doc.status = normalize(status) || "Responded";
    doc.respondedAt = new Date();
    doc.respondedBy = normalize(req.user?.email || req.user?.id || "Admin");
    await doc.save();

    try {
      await sendEmail({
        to: doc.email,
        subject: "Response to your query - SchoolY",
        html: `
          <p>Hello ${doc.firstName},</p>
          <p>Thank you for contacting us. Here is our response:</p>
          <p><b>Your message:</b><br/>${doc.message}</p>
          <p><b>Our response:</b><br/>${doc.adminResponse}</p>
        `,
      });
    } catch (e) {
      console.error("Contact response mail error:", e?.message || e);
    }

    return res.status(200).json({ success: true, message: "Response sent successfully", data: doc });
  } catch (error) {
    console.error("respondContactMessage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!["New", "Responded", "Closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const doc = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!doc) return res.status(404).json({ success: false, message: "Message not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("updateContactStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
