const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const nodemailer = require('nodemailer');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class SupportDialog extends ComponentDialog {
    constructor() {
        super('SUPPORT_DIALOG');

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.contactStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async contactStep(stepContext) {
        // Create an object in which to collect the user's information within the dialog.
        await stepContext.context.sendActivity(`Sending email to support!`);
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.MySQLHost,
            user: process.env.MySQLUser,
            password: process.env.MySQLPassword,
            database: process.env.MySQLDatabase
        });
        const [rows] = await connection.execute('SELECT * from transcript WHERE conversationId = ? ORDER BY timestamp ASC', [stepContext.context.activity.conversation.id]);
        await this.sendEmail(rows);
        await stepContext.context.sendActivity(`Support Contacted!`);

        return await stepContext.endDialog('SUPPORT_DIALOG');
    }

    async sendEmail(transcript) {
        let transcriptStr = '';
        let transporter = nodemailer.createTransport({
            host: process.env.EmailHost,
            port: process.env.EmailPort,
            secure: process.env.EmailSSL, // true for 465, false for other ports
            auth: {
                user: process.env.EmailUser, // generated ethereal user
                pass: process.env.EmailPassword // generated ethereal password
            }
        });

        await transcript.forEach(function(transcript) {
            transcriptStr += '<b>' + transcript.user + '</b> : ' + transcript.message + ' <br>\n';
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: process.env.EmailUser, // sender address
            to: process.env.SupportEmail,
            subject: 'Support Request', // Subject line
            text: transcriptStr, // plain text body
            html: '<h3>User requested support </h3><br><b>Chat Transcript</b><br><p>' + transcriptStr + '</p>' // html body
        });

        console.log('Message sent: %s', info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    }
}

module.exports.SupportDialog = SupportDialog;
