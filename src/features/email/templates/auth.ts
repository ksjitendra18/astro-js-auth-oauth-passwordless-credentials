import { generateOTP, generateRandomToken } from "../../../lib/random-string";
import redis from "../../../lib/redis";
import { FixedWindowRateLimiter } from "../../ratelimit/services";
import { sendMail } from "../services/send";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

export const sendVerificationMail = async ({ email }: { email: string }) => {
  const token = generateOTP();
  const verificationId = generateRandomToken();

  try {
    const rateLimiter = new FixedWindowRateLimiter(
      `email_verification`,
      60 * 60,
      3
    );

    const ratelimitResponse = await rateLimiter.checkLimit(email);

    if (!ratelimitResponse.allowed) {
      return { allowed: ratelimitResponse.allowed, verificationId: null };
    }

    const res = await sendMail({
      to: email,
      subject: `${token} is your email verification code`,
      htmlBody: `<div>The code for verification is ${token} </div>
            <div>The code is valid for only 1 hour</div>
            <div>You have received this email because you or someone tried to signup on the website </div>
            <div>If you didn't signup, kindly ignore this email.</div>
            <div>For support contact us at contact[at]example.com</div>
            `,
    });

    if (res.ok) {
      await redis.set(verificationId, `${token}:${email}`, "EX", 3600);

      return { allowed: true, verificationId };
    } else {
      throw new Error("Error while sending mail");
    }
  } catch (error) {
    console.log("error while sending mail", error);
    throw new Error("Error while sending mail");
  }
};

export const sendMagicLink = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  const token = generateOTP();
  const verificationId = generateRandomToken();

  try {
    const rateLimiter = new FixedWindowRateLimiter(`magic_link`, 60 * 60, 3);

    const ratelimitResponse = await rateLimiter.checkLimit(email);

    if (!ratelimitResponse.allowed) {
      return { allowed: ratelimitResponse.allowed, verificationId: null };
    }

    const res = await sendMail({
      to: email,
      subject: `Log in to Astro Auth`,
      htmlBody: `<div>Log in as ${email} </div>
      <p>Enter the code ${token} in the browser or follow the link below</p>
      <a href="${url}/magic-link/${verificationId}">Log in</a>
      <div>The link is valid for 2 hours</div>
      <div>You have received this email because you or someone tried to signup on the website </div>
      <div>If you didn't signup, kindly ignore this email.</div>
      <div>For support contact us at ${SUPPORT_EMAIL}</div>
      `,
    });

    if (res.ok) {
      await redis.set(verificationId, `${token}:${email}`, "EX", 7200);
      return { allowed: true, verificationId };
    } else {
      throw new Error("Error while sending mail");
    }
  } catch (error) {
    console.log("error while sending mail", error);
    throw new Error("Error while sending mail");
  }
};

export const sendPasswordResetMail = async ({
  email,
  url,
  userExists,
}: {
  email: string;
  url: string;
  userExists: boolean;
}) => {
  const verificationId = generateRandomToken();

  try {
    const rateLimiter = new FixedWindowRateLimiter(
      `password_reset`,
      60 * 60,
      3
    );

    const ratelimitResponse = await rateLimiter.checkLimit(email);

    if (!ratelimitResponse.allowed) {
      return { allowed: ratelimitResponse.allowed, verificationId: null };
    }

    if (!userExists) {
      return { allowed: true, verificationId };
    }

    const res = await sendMail({
      to: email,
      subject: `Password Reset Request`,
      htmlBody: `<div>Reset your password </div>
      <a href=${url}/forgot-password/${verificationId}>Reset Password</a>
      <div>The link is valid for only 1 hour</div>
      <div>You have received this email because you or someone tried to reset the password. </div>
      <div>If you didn't send this, firstly reset your password and contact support.</div>
      <div>For support contact us at ${SUPPORT_EMAIL}</div>
      `,
    });

    if (res.ok) {
      await redis.set(verificationId, email, "EX", 3600);

      return {
        allowed: true,
        verificationId,
      };
    } else {
      throw new Error("Error while sending mail");
    }
  } catch (error) {
    console.log("error while sending mail", error);
    throw new Error("Error while sending mail");
  }
};

export const sendPasswordResetConfirmationMail = async ({
  email,
}: {
  email: string;
}) => {
  try {
    const res = await sendMail({
      to: email,
      subject: `Password Reset Confirmation`,
      htmlBody: `<div> Your password was reset successfully </div>     
      <div>If you didn't do this,immediately reset your password and contact support.</div>
      <div>For support contact us at ${SUPPORT_EMAIL}</div>
      `,
    });

    return { res };
  } catch (error) {
    console.log("error while password reset confirmation mail", error);
    throw new Error("Error while sending mail");
  }
};

export const sendAccountDeletionRequestMail = async ({
  email,
}: {
  email: string;
}) => {
  const verificationId = generateRandomToken();
  const otpCode = generateOTP();

  try {
    const rateLimiter = new FixedWindowRateLimiter(
      `password_reset`,
      60 * 60,
      3
    );

    const ratelimitResponse = await rateLimiter.checkLimit(email);

    if (!ratelimitResponse.allowed) {
      return { allowed: ratelimitResponse.allowed, verificationId: null };
    }

    const res = await sendMail({
      to: email,
      subject: `Account Deletion Request`,
      htmlBody: `<div>Code for deleting your account is ${otpCode} </div>
            <div>The code is valid for only 1 hour</div>
            <div>You have received this email because you or someone tried to delete your account. </div>
            <div>If you didn't send this, firstly reset your password and contact support.</div>
            <div>For support contact us at ${SUPPORT_EMAIL}</div>
            `,
    });

    if (res.ok) {
      await redis.set(verificationId, `${otpCode}:${email}`, "EX", 3600);

      return {
        allowed: true,
        verificationId,
      };
    } else {
      throw new Error("Error while sending mail");
    }
  } catch (error) {
    console.log("error while sending account deletion request mail", error);
    throw new Error("Error while sending mail");
  }
};

export const sendEmailChangeOtpMail = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  try {
    const verificationId = generateRandomToken();
    const otpCode = generateOTP();

    const rateLimiter = new FixedWindowRateLimiter(
      `email_verification`,
      60 * 60,
      3
    );

    const ratelimitResponse = await rateLimiter.checkLimit(email);

    if (!ratelimitResponse.allowed) {
      return { allowed: ratelimitResponse.allowed, verificationId: null };
    }

    const res = await sendMail({
      to: email,
      subject: `Email Change Request`,
      htmlBody: `<div>The code for verification is ${otpCode} </div>
            <div>The code is valid for only 1 hour</div>
            <div>You have received this email because you or someone tried to change email of your account on the website </div>
            <div>If you didn't perform this account, immdiately change your account credentials and contact the support.</div> 
            <div>For support contact us at contact[at]example.com</div>
            `,
    });

    if (res.ok) {
      await redis.set(verificationId, `${otpCode}:${email}`, "EX", 3600);

      return { allowed: true, verificationId };
    } else {
      throw new Error("Error while sending  mail");
    }
  } catch (err) {
    console.log("Error while sending email change otp mail", err);
    throw new Error("Error while sending email change otp mail");
  }
};

export const sendTwoFactorActivationMail = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  const res = await sendMail({
    to: email,
    subject: `Two-Factor Authentication Enabled on Your Account`,
    htmlBody: `<div>
    <p>
                Two-factor authentication (2FA) has been successfully enabled on your account. 
                This adds an extra layer of security to help keep your account safe.
            </p>
            <h2>What’s Next?</h2>
            <p>Each time you log in, you’ll need:</p>
            <ul>
                <li>Your authentication method</li>
                <li>A verification code from your authenticator app</li>
            </ul>

                  <h2>Download Your Recovery Codes</h2>
            <p>
                To ensure you never lose access to your account, we recommend downloading and securely storing your recovery codes. 
                These codes can be used to log in if you lose access to your authenticator app.
            </p>

            <p>
              <a href="${url}/recovery-codes" target="_blank"> Download Recovery Codes</a>
            </p>
            <p>
                If you didn’t enable 2FA or believe this action was unauthorized, please 
                <a href="mailto:${SUPPORT_EMAIL}" target="_blank"> contact our support team</a> immediately.
            </p>
        </div>


    `,
  });

  return { res };
};

export const sendTwoFactorDeactivationMail = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  try {
    const res = await sendMail({
      to: email,
      subject: `Two-Factor Authentication Disabled for your Account`,
      htmlBody: `<div>
    <p>
                Two-factor authentication (2FA) has been disabled on your account. 
                We recommend you to enable 2FA to help keep your account safe.
            </p>
            </div>  
            `,
    });

    return { res };
  } catch (error) {
    console.log("error while sending two factor deactivation mail", error);
    throw new Error("Error while sending mail");
  }
};
