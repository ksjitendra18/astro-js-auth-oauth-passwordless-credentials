interface SendEmail {
  from?: string;
  to: string;
  subject: string;
  htmlBody: string;
}

export const sendMail = async ({ from, to, subject, htmlBody }: SendEmail) => {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:
          from ??
          ` ${import.meta.env.FROM_SENDER_NAME} <${
            import.meta.env.FROM_EMAIL
          }>`,
        to: to,
        subject: subject,
        html: htmlBody,
      }),
    });

    return { ok: res.ok, staus: res.status, message: res.statusText };
  } catch (error) {
    console.log("Eror sending email", error);
    throw new Error("Error sending email");
  }
};
