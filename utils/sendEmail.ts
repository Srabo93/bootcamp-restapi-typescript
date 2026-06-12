import nodemailer, { Transporter } from "nodemailer";
import {
  SMTP_EMAIL,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  FROM_EMAIL,
  FROM_NAME,
} from "../config/config";

interface MailOptions {
  email: string;
  subject: string;
  message: string;
}
// create reusable transporter object using the default SMTP transport
let transporter: Transporter;

const setupTransporter = async () => {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const sendEmail = async (options: MailOptions) => {
  try {
    if (!transporter) {
      await setupTransporter();
    }
    // send mail with defined transport object
    const message = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`, // sender address
      to: options.email, // list of receivers
      subject: options.subject, // Subject line
      text: options.message,
    };

    const info = await transporter.sendMail(message);
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.log(err);
  }
};
export default sendEmail;
