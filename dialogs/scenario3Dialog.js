const { ComponentDialog, WaterfallDialog, TextPrompt, DateTimePrompt, ConfirmPrompt } = require('botbuilder-dialogs');
const moment = require('moment');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Scenario3Dialog extends ComponentDialog {
    constructor() {
        super('SCENARIO3_DIALOG');

        this.addDialog(new TextPrompt('TEXT_PROMPT'));
        this.addDialog(new TextPrompt('MOBILE_PROMPT', this.mobileValidator));
        this.addDialog(new ConfirmPrompt('CONFIRM_PROMPT'));
        this.addDialog(new DateTimePrompt('DATE_TIME_PROMPT'));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.nricStep.bind(this),
            this.mobileStep.bind(this),
            this.snStep.bind(this),
            this.dateStep.bind(this),
            this.tacOtpStep.bind(this),
            this.tacOtp2Step.bind(this),
            this.confirmAltStep.bind(this),
            this.altMobileStep.bind(this),
            this.confirmStep.bind(this),
            this.validationStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(step) {
        step.values.info = [];

        return await step.prompt('TEXT_PROMPT', 'Please enter the customer name');
    }

    async nricStep(step) {
        step.values.info.push(step.result);
        return await step.prompt('TEXT_PROMPT', 'Please enter the customer NRIC or Passport');
    }

    async mobileStep(step) {
        step.values.info.push(step.result);
        const pOptions = { prompt: 'Please provide the mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
        return await step.prompt('MOBILE_PROMPT', pOptions);
    }

    async snStep(step) {
        step.values.info.push(step.result);
        return await step.prompt('TEXT_PROMPT', 'Please enter the S/N');
    }

    async dateStep(step) {
        step.values.info.push(step.result);
        const pOptions = { prompt: 'Please tell us when did the issue occured?', retryPrompt: 'Please enter a vaild date\n Examples: \nToday, around 9 AM\n17-Apr-2019, 16:03:09 PM\n17/04/2019 4:03 PM\nYesterday around 6 in the evening' };
        return await step.prompt('DATE_TIME_PROMPT', pOptions);
    }

    async tacOtpStep(step) {
        if (step.result[0].type === 'time') {
            step.values.info.push(moment().format('YYYY-MM-DD ' + step.result[0].value));
            return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification number for Client A');
        } else if (step.result[0].type === 'date') {
            step.values.info.push(moment().format(step.result[0].value + ' HH:mm:ss'));
            return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification number for Client A');
        } else {
            step.values.info.push(step.result[0].value);
            return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification number for Client A');
        }
    }

    async tacOtp2Step(step) {
        step.values.info.push(step.result);
        return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification number for Client B');
    }

    async confirmAltStep(step) {
        step.values.info.push(step.result);
        return await step.prompt('CONFIRM_PROMPT', 'Is there an alternative number?', ['yes', 'no']);
    }

    async altMobileStep(step) {
        if (step.result) {
            const pOptions = { prompt: 'Please provide the alt mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
            return await step.prompt('MOBILE_PROMPT', pOptions);
        } else {
            return await step.next('NaN');
        }
    }

    async confirmStep(step) {
        step.values.info.push(step.result);
        await step.context.sendActivity('Here is what I have collected so far:\n' +
        'Name: ' + step.values.info[0] + '\n' +
        'NRIC/Passport: ' + step.values.info[1] + '\n' +
        'Mobile No: ' + step.values.info[2] + '\n' +
        'S/N: ' + step.values.info[3] + '\n' +
        'Date and Time: ' + step.values.info[4] + '\n' +
        'TAC/OTP clarification (client A): ' + step.values.info[5] + '\n' +
        'TAC/OTP clarification (client B): ' + step.values.info[6] + '\n' +
        'Alt. No: ' + step.values.info[7]);

        return await step.prompt('CONFIRM_PROMPT', 'Would you like me to check the database with the details provided?', ['yes', 'no']);
    }

    async validationStep(step) {
        let telco = '';
        if (step.result) {
            const mysql = require('mysql2/promise');
            const connection = await mysql.createConnection({
                host: process.env.MySQLHost,
                user: process.env.MySQLUser,
                password: process.env.MySQLPassword,
                database: process.env.MySQLDatabase
            });
            const [rows] = await connection.execute('SELECT telco FROM transaction WHERE phoneNo = ? AND date = ?', [step.values.info[2], step.values.info[4]]);
            if (rows.length !== 0) {
                telco = rows[0].telco;
            }
            if (rows.length !== 0) {
                const [uRows] = await connection.execute('UPDATE transaction SET telco = "TELCO-A" WHERE phoneNo = ? AND date = ?', [step.values.info[2], step.values.info[4]]);
                console.log(uRows);
                await step.context.sendActivity('Upon checking we did observe that the number provided was pointing to ' + telco + ' as its telco provider. However, we have now updated the provider to TELCO-A. Kindly advise the customer to retry.');
            } else {
                await step.context.sendActivity('Could not find the record! Please try again.');
            }
            connection.end();
            return await step.endDialog('SCENARIO3_DIALOG');
        } else {
            step.context.sendActivity('Ok, you can still ask me any questions you may have or enter "support" if you`re encountering problems');
            return await step.endDialog('SCENARIO3_DIALOG');
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

module.exports.Scenario3Dialog = Scenario3Dialog;
