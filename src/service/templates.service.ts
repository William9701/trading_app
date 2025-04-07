export class EmailTemplates {
    static verificationEmail(recipientName: string, otpCode: string): {
      subject: string;
      content_text: string;
      content_html: string;
    } {
      const subject = "Verify Your Email for FXFlow";
      const text_content = `Hello ${recipientName}, ...`;
      const html_content = `<!DOCTYPE html><html>Thank you for registering with FXFlow. Your verification code is: ${otpCode} 
      This code will expire in 15 minutes.

If you did not request this code, please ignore this email.

Best regards,
The FXFlow Team
"""
        
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            background-color: #f9f9f9;
        }}
        .code {{
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            padding: 10px;
            text-align: center;
            margin: 20px 0;
            background-color: #eee;
            border-radius: 5px;
        }}
        .footer {{
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Email Verification</h2>
        <p>Hello {recipient_name},</p>
        <p>Thank you for registering with FXFlow. Please use the verification code below to complete your registration:</p>
        
        <div class="code">{otp_code}</div>
        
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        
        <p>Best regards,<br>The FXFlow Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {datetime.now().year} FXFlow. All rights reserved.</p>
    </div>
</body></html>`;
  
      return { subject, content_text: text_content, content_html: html_content };
    }
  }
  