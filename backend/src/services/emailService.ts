import logger from "../config/logger";
import resend from "./mailer";
import transporter from "./mailer";

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify-mail?token=${token}`;

  const { error } = await resend.emails.send({
    from: `"ApplyThis" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "WELCOME TO APPLYTHIS - PLEASE CONFIRM YOUR EMAIL ADDRESS",
    text: "WELCOME TO APPLYTHIS, VERIFY YOUR EMAIL BY VISITING: ${verifyUrl}",
    html: `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="font-family: Inter, sans-serif; background: #0f0f0f; margin: 0; padding: 40px 20px;">
    <div style="max-width: 850px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <div style="width: 100%;
    text-align: center;">
    <img src="https://kfumnptaaaznvzozouwt.supabase.co/storage/v1/object/public/applythis-s3/at3.png" alt="Company Logo" width="139.79" height="32"/>
                   </div>
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 500; margin: 0 0 16px 0;">
            Verify your email address
        </h2>

        <p style="
    
  line-height: 16px;
  text-align: left;
  letter-spacing: 0.5px;
  font-weight: 400;
  font-size: 11px;
  color: black;
        ">
            THANK YOU FOR CREATING YOUR PERSONAL ACCOUNT ON APPLYTHIS. PLEASE CLICK ON THE LINK BELOW TO ACTIVATE YOUR ACCOUNT:
        </p>

        <a href="${verifyUrl}" style="
  line-height: 16.5px;
  letter-spacing: 0.3px;
  font-size: 11px;
  text-align: center;
  cursor: pointer;
  padding: 6px 28px;
  background-color: black;
  border: medium;
  text-decoration: none;
  color: white;
  display: block;
        ">
            ACTIVATE YOUR ACCOUNT

        </a>
        <table style="margin-top: 20px;">
            <tr style="">
                <td style="color:#000000; font-size:11px;=20 letter-spacing:0.5px;font-weight:400; text-align:left; 
            line-height:15px;">
                    YOUR APPLYTHIS ACCOUNT GIVES YOU ACCESS TO THE FOLLOWING FEATURES:
                    <ul style='padding-le=ft: 14px;'>
                        <li><b>TRACK JOBS WITH BROWSER EXTENSION</b></li>
                        <li><b>CREATE AND UPDATE YOUR RESUMES</b><br><br></li>
                        <li><b>ACCESS TO A LATEX EDITOR FOR QUICK EDIT</b><br><br></li>
                        <li><b>MANAGE YOUR JOB APPLICATIONS</b></li>
                        <li><b>DASHBOARD TO KEEP YOU ON THE RIGHT TRACK</b><br><br></li>
                    </ul>
                </td>
            </tr>
        </table>


        <p style="color: #525252; font-size: 10px; margin: 32px 0 0 0; line-height: 1.6;">
            IF YOU DIDN'T CREATE AN ACCOUNT, YOU CAN SAFELY IGNORE THIS EMAIL.<br>
            LINK NOT WORKING? COPY AND PASTE THIS URL INTO YOUR BROWSER:<br>
            <span style="color: #a3a3a3; word-break: break-all;">${verifyUrl}</span>
        </p>

    </div>
</body>

</html>

`,
  });
  if (error) {
    logger.error(
      { message: error.message },
      "resend failed to send verification mail",
    );
    throw new Error(`email send failed ${error.message}`);
  }
  logger.info({ email }, "verification mail sent");
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: `"ApplyThis" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Reset your ApplyThis password",
    text: `Reset your password by visiting: ${resetUrl}\nThe link expires in 1 hour. If you didn't ask for this, ignore this email.`,
    html: `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="font-family: Inter, sans-serif; background: #0f0f0f; margin: 0; padding: 40px 20px;">
    <div style="max-width: 850px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <div style="width: 100%;
    text-align: center;">
    <img src="https://kfumnptaaaznvzozouwt.supabase.co/storage/v1/object/public/applythis-s3/at3.png" alt="Company Logo" width="139.79" height="32"/>
                  </div>
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 500; margin: 0 0 16px 0;">
            Verify your email address
        </h2>

        <p style="
    
  line-height: 16px;
  text-align: left;
  letter-spacing: 0.5px;
  font-weight: 400;
  font-size: 11px;
  color: black;
        ">
            CLICK THE BUTTON BELOW TO CHOOSE A NEW PASSWORD. THE LINK EXPIRES IN 1 HOUR.
        </p>

        <a href="${resetUrl}" style="
  line-height: 16.5px;
  letter-spacing: 0.3px;
  font-size: 11px;
  text-align: center;
  cursor: pointer;
  padding: 6px 28px;
  background-color: black;
  border: medium;
  text-decoration: none;
  color: white;
  display: block;
        ">
            RESET PASSWORD

        </a>


        <p style="color: #525252; font-size: 10px; margin: 32px 0 0 0; line-height: 1.6;">
             IF YOU DIDN'T ASK FOR THIS, YOU CAN IGNORE THIS EMAIL.<BR>
          LINK NOT WORKING? COPY THIS INTO YOUR BROWSER:<BR>${resetUrl}
        </p>

    </div>
</body>

</html>


    `,
  });

  if (error) {
    throw new Error(`email send failed ${error.message}`);
  }
  logger.info({ email }, "reset mail sent");
}
