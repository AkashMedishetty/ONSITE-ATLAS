
# ONSITE ATLAS Email Template Guide

## Table of Contents
1. [Overview](#overview)
2. [Accessing Email Templates](#accessing-email-templates)
3. [Understanding Placeholders](#understanding-placeholders)
4. [Editing and Customizing Templates](#editing-and-customizing-templates)
5. [Best Practices for HTML Formatting](#best-practices-for-html-formatting)
6. [Including QR Codes and Dynamic Data](#including-qr-codes-and-dynamic-data)
7. [Previewing and Testing Emails](#previewing-and-testing-emails)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)
9. [Security and Deliverability Tips](#security-and-deliverability-tips)
10. [FAQ](#faq)

---

## 1. Overview

ONSITE ATLAS supports fully customizable email templates for all major event communications, including registration confirmations, reminders, certificates, and more. Templates use dynamic placeholders to personalize content for each recipient, and support rich HTML formatting for professional, branded emails.

---

## 2. Accessing Email Templates

1. **Log in** to the ONSITE ATLAS admin portal.
2. Navigate to your event and go to **Settings > Email**.
3. Click the **"Email Templates"** tab.
4. Select the template you wish to edit (e.g., Registration Confirmation, Reminder, Certificate, etc.).

![Email Template Tab Screenshot](./screenshots/email_template_tab.png)

---

## 3. Understanding Placeholders

Placeholders are special codes (e.g., `{{firstName}}`, `{{eventName}}`, `[QR_CODE]`) that are replaced with real data when the email is sent.

**Common Placeholders:**
- `{{firstName}}` — Attendee's first name
- `{{eventName}}` — Name of the event
- `{{registrationId}}` — Unique registration ID
- `{{eventDate}}` — Event date
- `{{eventVenue}}` — Event venue
- `[QR_CODE]` — Registration QR code image

**How to use:**
- Type or paste placeholders directly into the subject or body of your template.
- Example: `Dear {{firstName}}, your registration for {{eventName}} is confirmed!`

---

## 4. Editing and Customizing Templates

- Use the rich text editor to add or edit content.
- You can use **bold**, *italic*, lists, links, and images.
- Insert placeholders using the provided buttons or by typing them.
- **Do not wrap the entire template in a single tag (like `<h1>`).**
- Use `<p>`, `<br>`, and `<div>` for structure.

**Example Template:**
```html
<p>Dear {{firstName}},</p>
<p>Thank you for registering for {{eventName}}.<br>
Your registration ID is: {{registrationId}}</p>
<p>Please keep this email for your reference. You can use the QR code below at the event for check-in:</p>
<div>[QR_CODE]</div>
<p>Event Details:<br>
Date: {{eventDate}}<br>
Venue: {{eventVenue}}</p>
<p>If you have any questions, please contact us.<br>
Regards,<br>
The Organizing Team</p>
```

---

## 5. Best Practices for HTML Formatting

- Use `<p>` for paragraphs, `<br>` for line breaks.
- Use `<div>` to separate sections.
- Avoid using `<h1>`, `<h2>`, etc. for the entire email body.
- Keep styles simple for best compatibility.
- Test your template in the preview before saving.

---

## 6. Including QR Codes and Dynamic Data

- To include a QR code, add `[QR_CODE]` where you want the image to appear.
- The system will automatically replace `[QR_CODE]` with the attendee's unique QR code image.
- You can use any other placeholder listed in section 3.

---

## 7. Previewing and Testing Emails

- Use the **Live Preview** in the admin UI to see how your email will look.
- The preview will show sample data and a note where the QR code will appear.
- To test with a real email:
  1. Go to the **SMTP Settings** tab and use the "Send Test" feature.
  2. Or, register a test attendee and check the email they receive.

---

## 8. Troubleshooting Common Issues

### QR Code Not Showing
- Ensure you have `[QR_CODE]` in your template body.
- Do not place `[QR_CODE]` inside a heading tag (like `<h1>`).
- Use `<div>[QR_CODE]</div>` or `<p>[QR_CODE]</p>`.

### Email Shows HTML Tags
- Make sure you are using the rich text editor, not plain text.
- Do not paste raw HTML with unclosed tags.
- Use the preview to check formatting.

### Formatting Looks Wrong
- Avoid wrapping the entire email in a single tag.
- Use multiple `<p>` or `<div>` blocks.
- Test in multiple email clients if possible.

### Email Not Sending
- Check SMTP settings in the **SMTP Settings** tab.
- Make sure email notifications are enabled.
- Check for typos in placeholders.

---

## 9. Security and Deliverability Tips

- Always include a plain text version (the system does this automatically).
- Avoid using too many images or large attachments.
- Use a professional sender name and email address.
- Test with different email providers (Gmail, Outlook, etc.).
- Avoid spammy words in your subject and body.

---

## 10. FAQ

**Q: Can I add my own placeholders?**
A: Only the placeholders listed in the UI are supported. For custom data, contact your developer.

**Q: Can I use images or logos?**
A: Yes, use the image button in the editor to upload or link images.

**Q: How do I reset a template to default?**
A: Use the "Reset" button in the template editor.

**Q: Why does my email look different in Gmail vs. Outlook?**
A: Email clients render HTML differently. Use simple, clean HTML for best results.

**Q: How do I test the QR code?**
A: Register a test attendee and check the email they receive. The QR code should appear as an image.

---

## Screenshots & Diagrams

- ![Email Template Tab](./screenshots/email_template_tab.png)
- ![Live Preview Example](./screenshots/email_preview.png)
- ![SMTP Settings Tab](./screenshots/smtp_settings_tab.png)

---

For further help, contact your system administrator or support team. 