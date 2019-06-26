const { ComponentDialog, WaterfallDialog, TextPrompt, DateTimePrompt, ConfirmPrompt } = require('botbuilder-dialogs');
const moment = require('moment');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Scenario6Dialog extends ComponentDialog {
    constructor() {
        super('SCENARIO6_DIALOG');

        this.addDialog(new TextPrompt('TEXT_PROMPT'));
        this.addDialog(new TextPrompt('MOBILE_PROMPT', this.mobileValidator));
        this.addDialog(new ConfirmPrompt('CONFIRM_PROMPT'));
        this.addDialog(new DateTimePrompt('DATE_TIME_PROMPT'));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.phoneNoStep.bind(this),
            this.smsDateStep.bind(this),
            this.UserIdStep.bind(this),
            this.smsContentStep.bind(this),
            this.mainAccIdStep.bind(this),
            this.mainAccUrlStep.bind(this),
            this.confirmStep.bind(this),
            this.validationStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async phoneNoStep(step) {
        step.values.info = [];
        const pOptions = { prompt: 'Please provide the mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
        return await step.prompt('MOBILE_PROMPT', pOptions);
    }

    async smsDateStep(step) {
        step.values.info.push(step.result);
        const pOptions = { prompt: 'When was the sms sent?', retryPrompt: 'Please enter a vaild date\n Examples: \nToday, around 9 AM\n17-Apr-2019, 16:03:09 PM\n17/04/2019 4:03 PM\nYesterday around 6 in the evening' };
        return await step.prompt('DATE_TIME_PROMPT', pOptions);
    }

    async UserIdStep(step) {
        if (step.result[0].type === 'time') {
            step.values.info.push(moment().format('YYYY-MM-DD ' + step.result[0].value));
            return await step.prompt('TEXT_PROMPT', 'Please enter the User ID');
        } else if (step.result[0].type === 'date') {
            step.values.info.push(moment().format(step.result[0].value + ' HH:mm:ss'));
            return await step.prompt('TEXT_PROMPT', 'Please enter the User ID');
        } else {
            step.values.info.push(step.result[0].value);
            return await step.prompt('TEXT_PROMPT', 'Please enter the User ID');
        }
    }

    async smsContentStep(step) {
        step.values.info.push(step.result);
        return await step.prompt('TEXT_PROMPT', 'What was the content of the message that was sent?');
    }

    async mainAccIdStep(step) {
        step.values.info.push(step.result);
        return await step.prompt('TEXT_PROMPT', 'Please provide the ID of the Main Account');
    }

    async mainAccUrlStep(step) {
        step.values.info.push(step.result);
        return await step.prompt('TEXT_PROMPT', 'Please provide the URL of the Main Account');
    }

    async confirmStep(step) {
        step.values.info.push(step.result);
        await step.context.sendActivity('Here is what I have collected so far:\n' +
        'Phone Number: ' + step.values.info[0] + '\n' +
        'SMS Date: ' + step.values.info[1] + '\n' +
        'User ID: ' + step.values.info[2] + '\n' +
        'SMS Content: ' + step.values.info[3] + '\n' +
        'Main Account ID: ' + step.values.info[4] + '\n' +
        'Main Account URL: ' + step.values.info[5] + '\n');

        return await step.prompt('CONFIRM_PROMPT', 'Would you like me to check the database with the details provided?', ['yes', 'no']);
    }

    async altMobileStep(step) {
        if (step.result) {
            const pOptions = { prompt: 'Please provide the alt mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
            return await step.prompt('MOBILE_PROMPT', pOptions);
        } else {
            return await step.next('NaN');
        }
    }

    async validationStep(step) {
        // if yes
        if (step.result) {
            const mysql = require('mysql2/promise');
            const connection = await mysql.createConnection({
                host: process.env.MySQLHost,
                user: process.env.MySQLUser,
                password: process.env.MySQLPassword,
                database: process.env.MySQLDatabase
            });
            let month = (moment(step.values.info[1]).month()) + 1;
            let year = (moment(step.values.info[1]).year());
            const [rows] = await connection.execute('SELECT * FROM info WHERE phoneNo = ? AND MONTH(smsDate) = ? AND YEAR(smsDate) = ?', [step.values.info[0], month, year]);
            if (rows.length !== 0) {
                await step.context.sendActivity('We were able to pull out these data for your inquiry: \n' +
                    'MTID:' + rows[0].mtid + '\n' +
                    'Client: ' + rows[0].client + '\n' +
                    'Sender ID: ' + rows[0].senderId + '\n' +
                    'MSISDN: ' + rows[0].msisdn + '\n' +
                    'Broadcast Date: ' + rows[0].bDate + '\n' +
                    'Broadcast Message: ' + rows[0].bMessage);
                connection.end();
                return await step.endDialog('SCENARIO6_DIALOG');
            } else {
                connection.end();
                await step.context.sendActivity('Could not find the record! Please try again.');
                return await step.endDialog('SCENARIO6_DIALOG');
            }
        } else {
            step.context.sendActivity('Ok, you can still ask me any questions you may have or enter "support" if you`re encountering problems');
            return await step.endDialog('SCENARIO6_DIALOG');
        }
    }

    async mobileValidator(context) {
        let regMobNum = /[0-9]{10,11}/;
        if (context.recognized.succeeded) {
            let result = context.recognized.value;
            if (result.match(regMobNum)) {
                return true;
            }
        } else {
            return false;
        }
    }
}

module.exports.Scenario6Dialog = Scenario6Dialog;
