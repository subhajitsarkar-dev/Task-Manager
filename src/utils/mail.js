import nodemailer from "nodemailer";
import Mailgen from "mailgen";

const sendMail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task-Manager",
      link: "https://mailgen.js/",
    },
  });

  var emailText = mailGenerator.generatePlaintext(options.mailGenContent);

  var emailhtml = mailGenerator.generate(options.mailGenContent);

  const transproter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_HOST,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailhtml,
  };

  try {
    await transproter.sendMail(mail);
  } catch (error) {
    console.error("Email failed", error);
  }
};

const emailVerificationMailGenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro:
        "Welcome to Task-Manager! We're very excited to have you on board.",
      action: {
        instructions: "To get started our App, please click here:",
        button: {
          color: "#22BC66",
          text: "Verify Your Email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
const forgotPasswordVerificationEmail = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset your password!",
      action: {
        instructions: "To change your password click the button.",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
