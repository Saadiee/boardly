import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendMail = async (options) => {
  var mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Boardly",
      link: "https://boardly.com",
    },
  });

  var emailHTML = mailGenerator.generate(options.mailGenContent);
  var emailText = mailGenerator.generatePlaintext(options.mailGenContent);

  // * NODEMAILER TRANSPORTERE
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: process.env.MAILTRAP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });

  const mail = {
    from: 'Baordly" <info@boardly.com>', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: emailText, // plain text body
    html: emailHTML, // html body
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log("Error, email send Failed", error);
  }
};

export const emailVerificationMailgenContent = (username, verificationUrl) => ({
  body: {
    name: username,
    intro: "Welcome to Boardly. We are excited to have you onboard!",
    action: {
      instructions: "To get started with Boardly, please click here:",
      button: {
        color: "#22BC66",
        text: "Verify your email",
        link: verificationUrl,
      },
    },
    outro: "Need help? Just reply to this email—we'd love to help.",
  },
});

export const forgotPasswordMailgenContent = (username, resetUrl) => ({
  body: {
    name: username,
    intro: "You requested to reset your password.",
    action: {
      instructions: "To reset your password, click the button below:",
      button: {
        color: "#bc2722",
        text: "Reset password",
        link: resetUrl,
      },
    },
    outro: "If you didn't request this, just ignore this email.",
  },
});

/*
sendMail({
  email: user.email,
  subject: "Subject of email",
  mailGenContent: emailVerificationMailgenContent(username, verificationUrl)
})
 */
