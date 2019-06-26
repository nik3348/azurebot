const { ComponentDialog, WaterfallDialog, TextPrompt, ConfirmPrompt } = require('botbuilder-dialogs');
const nodemailer = require('nodemailer');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

class SupportDialog extends ComponentDialog {
    constructor() {
        super('SUPPORT_DIALOG');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new TextPrompt('EMAIL_PROMPT', this.emailValidator));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.emailStep.bind(this),
            this.confirmStep.bind(this),
            this.contactStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async emailStep(stepContext) {
        stepContext.values.email = '';
        const pOptions = { prompt: 'Please provide us your email so that our support team may reach out to you', retryPrompt: 'Please make sure that your email is in the right format!\n Example : macrokiosk@gmail.com' };
        return await stepContext.prompt('EMAIL_PROMPT', pOptions);
    }

    async confirmStep(stepContext) {
        stepContext.values.email = stepContext.result;
        await stepContext.context.sendActivity(stepContext.values.email);
        return await stepContext.prompt(CONFIRM_PROMPT, 'Is this your email?', ['yes', 'no']);
    }

    async contactStep(stepContext) {
        if (stepContext.result) {
            let email = stepContext.values.email;
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
            await this.sendEmail(rows, email);
            await stepContext.context.sendActivity(`The support team has been notified! Please be patient as it may take some time to process your request.`);
            connection.end();
            return await stepContext.endDialog('SUPPORT_DIALOG');
        } else {
            await stepContext.context.sendActivity(`Support was not contacted. You may enter "support" to try again or try asking me the questions again.`);
            return await stepContext.endDialog('SUPPORT_DIALOG');
        }
    }

    async sendEmail(transcript, email) {
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
            html: '<h3>User requested support </h3><br><h4>User email : ' + email + '</h4><br><b>Chat Transcript</b><br><p>' + transcriptStr + '</p>' // html body
        });

        console.log('Message sent: %s', info.messageId);
    }

    async emailValidator(context) {
        let regEmail = /\S+@\S+\.\S+/;
        if (context.recognized.succeeded) {
            let result = context.recognized.value;
            if (result.match(regEmail)) {
                return true;
            }
        } else {
            return false;
        }
    }
}

module.exports.SupportDialog = SupportDialog;
