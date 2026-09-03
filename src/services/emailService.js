const nodemailer = require("nodemailer");

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    initTransporter() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT, 10) || 587,
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Default: local mock / jsonTransport for deterministic, zero-config testing
            this.transporter = nodemailer.createTransport({
                jsonTransport: true
            });
        }
    }

    /**
     * Dispatches a responsive, styled welcome email to registered students
     */
    async sendWelcomeEmail(student, departmentName = "Academic Affairs") {
        if (!student || !student.email) return null;

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"EduManage Admissions" <admissions@edumanage.local>',
            to: student.email,
            subject: `🎓 Welcome to EduManage Pro, ${student.name}!`,
            text: `Dear ${student.name},\n\nCongratulations on your registration at EduManage Pro!\n\nStudent ID: #${student.id}\nCourse: ${student.course}\nDepartment: ${departmentName}\nStatus: ${student.status}\n\nYou can access your student portal at http://localhost:3000.\n\nBest regards,\nOffice of Admissions & Registrar`,
            html: `
                <div style="font-family:'Segoe UI',Roboto,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);padding:30px 24px;text-align:center;color:#ffffff;">
                        <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🎓 EduManage Pro</h1>
                        <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Office of Admissions & Academic Registry</p>
                    </div>
                    <div style="padding:28px 24px;color:#1e293b;line-height:1.6;">
                        <h2 style="margin-top:0;font-size:20px;color:#0f172a;">Welcome to the Academic Community, ${student.name}!</h2>
                        <p style="font-size:15px;color:#475569;">
                            We are delighted to confirm your formal student registration. Your institutional profile has been provisioned and is active.
                        </p>
                        
                        <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
                            <h3 style="margin:0 0 12px 0;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Enrolled Profile Summary</h3>
                            <table style="width:100%;font-size:14px;border-collapse:collapse;">
                                <tr>
                                    <td style="padding:6px 0;color:#64748b;width:140px;">Student ID:</td>
                                    <td style="padding:6px 0;font-weight:600;color:#0f172a;">#${student.id}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;color:#64748b;">Full Name:</td>
                                    <td style="padding:6px 0;font-weight:600;color:#0f172a;">${student.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;color:#64748b;">Course / Major:</td>
                                    <td style="padding:6px 0;font-weight:600;color:#4f46e5;">${student.course}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;color:#64748b;">Department:</td>
                                    <td style="padding:6px 0;font-weight:600;color:#0f172a;">${departmentName}</td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;color:#64748b;">Academic Status:</td>
                                    <td style="padding:6px 0;font-weight:600;color:#16a34a;">${student.status || 'Active'}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="font-size:14px;color:#475569;">
                            You may log in to the Student Portal anytime to check enrolled courses, transcripts, and campus announcements.
                        </p>

                        <div style="text-align:center;margin:28px 0 12px 0;">
                            <a href="http://localhost:3000" style="background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">Access Student Dashboard &rarr;</a>
                        </div>
                    </div>
                    <div style="background:#f1f5f9;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
                        This automated notification was generated by EduManage Pro. Please do not reply directly to this message.
                    </div>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            const previewUrl = nodemailer.getTestMessageUrl(info) || null;
            return {
                sent: true,
                messageId: info.messageId,
                previewUrl
            };
        } catch (err) {
            console.error("⚠️ Failed to send welcome email:", err.message);
            return {
                sent: false,
                error: err.message
            };
        }
    }
}

module.exports = new EmailService();
