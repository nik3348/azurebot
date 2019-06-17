const { ComponentDialog, WaterfallDialog, TextPrompt, DateTimePrompt, ConfirmPrompt } = require('botbuilder-dialogs');
const moment = require('moment');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Scenario2Dialog extends ComponentDialog {
    constructor() {
        super('SCENARIO2_DIALOG');

        this.addDialog(new TextPrompt('TEXT_PROMPT'));
        this.addDialog(new TextPrompt('MOBILE_PROMPT', this.mobileValidator));
        this.addDialog(new ConfirmPrompt('CONFIRM_PROMPT'));
        this.addDialog(new DateTimePrompt('DATE_TIME_PROMPT'));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.mobileStep.bind(this),
            this.snStep.bind(this),
            this.dateStep.bind(this),
            this.tacOtpStep.bind(this),
            this.confirmStep.bind(this),
            this.validationStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(step) {
        step.values.info = [];
        console.log('Please enter the customer name');
        return await step.prompt('TEXT_PROMPT', 'Please enter the customer name');
    }

    async mobileStep(step) {
        console.log(step.result);
        step.values.info.push(step.result);
        console.log('Please provide the mobile number');
        const pOptions = { prompt: 'Please provide the mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
        return await step.prompt('MOBILE_PROMPT', pOptions);
    }

    async snStep(step) {
        console.log(step.result);
        step.values.info.push(step.result);
        console.log('Please enter the S/N');
        return await step.prompt('TEXT_PROMPT', 'Please enter the S/N');
    }

    async dateStep(step) {
        console.log(step.result);
        step.values.info.push(step.result);
        console.log('Please tell us when did the issue occured?');
        const pOptions = { prompt: 'Please tell us when did the issue occured?', retryPrompt: 'Please enter a vaild date\n Examples: \nToday, around 9 AM\n17-Apr-2019, 16:03:09 PM\n17/04/2019 4:03 PM\nYesterday around 6 in the evening' };
        return await step.prompt('DATE_TIME_PROMPT', pOptions);
    }

    async tacOtpStep(step) {
        if (step.result[0].type === 'time') {
            step.values.info.push(moment().format('YYYY-MM-DD ' + step.result[0].value));
            console.log('Please enter the TAC/OTP clarification');
            return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification');
        } else if (step.result[0].type === 'date') {
            step.values.info.push(moment().format(step.result[0].value + ' HH:mm:ss'));
            console.log('Please enter the TAC/OTP clarification');
            return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification');
        } else {
            step.values.info.push(step.result[0].value);
            console.log('Please enter the TAC/OTP clarification');
            return await step.prompt('TEXT_PROMPT', 'Please enter the TAC/OTP clarification');
        }
    }

    async confirmStep(step) {
        step.values.info.push(step.result);
        console.log(step.values.info);
        await step.context.sendActivity('Here is what I have collected so far:\n' +
        'Name: ' + step.values.info[0] + '\n' +
        'Mobile No: ' + step.values.info[1] + '\n' +
        'Sim S/N: ' + step.values.info[2] + '\n' +
        'Date and Time: ' + step.values.info[3] + '\n' +
        'TAC/OTP clarification : ' + step.values.info[4]);

        // Logging for transcript
        console.log('Here is what I have collected so far:\n' +
        'Name: ' + step.values.info[0] + '\n' +
        'Mobile No: ' + step.values.info[1] + '\n' +
        'Sim S/N: ' + step.values.info[2] + '\n' +
        'Date and Time: ' + step.values.info[3] + '\n' +
        'TAC/OTP clarification : ' + step.values.info[4]);

        console.log('Would you like me to check the database with the details provided?');
        return await step.prompt('CONFIRM_PROMPT', 'Would you like me to check the database with the details provided?', ['yes', 'no']);
    }

    async validationStep(step) {
        // if yes
        if (step.result) {
            console.log(step.result);

            return await step.endDialog('SCENARIO2_DIALOG');
        } else {
            console.log(step.result);
            step.context.sendActivity('Ok, you can still ask me any questions you may have or enter "support" if you`re encountering problems');
            console.log('Ok, you can still ask me any questions you may have or enter "support" if you`re encountering problems');
            return await step.endDialog('SCENARIO2_DIALOG');
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

module.exports.Scenario2Dialog = Scenario2Dialog;
