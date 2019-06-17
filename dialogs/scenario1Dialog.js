const { ComponentDialog, WaterfallDialog, NumberPrompt, TextPrompt, DateTimePrompt } = require('botbuilder-dialogs');
const moment = require('moment');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
// const Recognizers = require('@microsoft/recognizers-text-suite');

let clientid = '';
let phoneNo = '';
let issueDate = '';
let status = 0;

class Scenario1Dialog extends ComponentDialog {
    constructor() {
        super('SCENARIO1_DIALOG');
        this.addDialog(new TextPrompt('TEXT_PROMPT'));
        this.addDialog(new TextPrompt('MOBILE_PROMPT', this.mobileValidator));
        this.addDialog(new NumberPrompt('NUMBER_PROMPT'));
        this.addDialog(new DateTimePrompt('DATE_TIME_PROMPT'));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.clientIdStep.bind(this),
            this.numberStep.bind(this),
            this.dateStep.bind(this),
            this.contactStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async clientIdStep(step) {
        return await step.prompt('TEXT_PROMPT', 'Please enter the client ID');
    }

    async numberStep(step) {
        clientid = step.result;
        const pOptions = { prompt: 'Please provide the mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
        return await step.prompt('MOBILE_PROMPT', pOptions);
    }

    async dateStep(step) {
        phoneNo = step.result;
        return await step.prompt('DATE_TIME_PROMPT', 'Please tell us when did the issue occured?');
    }

    async contactStep(step) {
        if (step.result[0].type === 'time') {
            issueDate = moment().format('YYYY-MM-DD ' + step.result[0].value);
        } else if (step.result[0].type === 'date') {
            issueDate = moment().format(step.result[0].value + ' HH:mm:ss');
        } else {
            issueDate = step.result[0].value;
        }
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.MySQLHost,
            user: process.env.MySQLUser,
            password: process.env.MySQLPassword,
            database: process.env.MySQLDatabase
        });
        const [rows] = await connection.execute('SELECT status FROM transaction WHERE clientId = ? AND phoneNo = ? AND date = ?', [clientid, phoneNo, issueDate]);
        status = rows[0].status;
        switch (status) {
        case 0:
            await step.context.sendActivity('Status not found');
            break;
        case 1:
            await step.context.sendActivity('Upon checking, we did not see any issue for the user to receive TAC. All the messages were successfully delivered. Kindly advise user to restart his/her phone and check if he/she has blocked the TAC sender from his/her inbox phone settings.');
            break;
        case 2:
            await step.context.sendActivity('Upon checking, we seen that the TACs was sent out to the end user. However, user might have not received the TAC due to network coverage disruption at the area where the request was made or even an issue from users device itself. \nKindly advise user to retry by following the steps below:\n* Make sure phone is in high coverage\n* Restarted phone to refresh network\n* Make sure phone inbox is not full\n* Check if any phone applications or settings that may filter our messages \n\nAlternatively, user may swap sim to another phone and retry. Kindly let us know if the issue still persists.');
            break;
        case 3:
            await step.context.sendActivity('As we checked there is no transaction log under CLIENT-XYZ for this number. \nKindly advise user to retry.');
            break;
        case 4:
            await step.context.sendActivity('Upon investigating based on the provided number/s, we’ve seen that the TACs have been sent out to the customer with no issues. However, user might have not received the TAC due to network coverage disruption at the area where the request was made or even an issue from users device itself. \nKindly advise user to retry by following the steps below:\n* Make sure phone is in high coverage\n* Restarted phone to refresh network\n* Make sure phone inbox is not full\n* Check if any phone applications or settings that may filter our messages \n\nAlternatively, user may swap sim to another phone and retry. Kindly let us know if the issue still persists.');
            break;
        default:
            await step.context.sendActivity('Status not found');
            break;
        }

        return await step.endDialog('SCENARIO1_DIALOG');
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

module.exports.Scenario1Dialog = Scenario1Dialog;
