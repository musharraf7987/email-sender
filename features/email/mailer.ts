import nodemailer from 'nodemailer';

type Attachment = {
  filename?: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection error:', error);
    return false;
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: Attachment[]
) => {
  const info = await transporter.sendMail({
    from: `"Musharraf" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });

  return { success: true, messageId: info.messageId };
};
