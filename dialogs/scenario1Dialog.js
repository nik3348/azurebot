const { ComponentDialog, WaterfallDialog, NumberPrompt, TextPrompt, DateTimePrompt } = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

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

    async clientIdStep(step){
        return await step.prompt('TEXT_PROMPT', 'Please enter the client ID');
    }

    async numberStep(step){
        const clientid = step.result;
        console.log(clientid);
        const pOptions =  { prompt: 'Please provide the mobile number', retryPrompt: 'Please enter a vaild phone number, make sure there are no symbols and the number does not exceed 11!' };
        return await step.prompt('MOBILE_PROMPT', pOptions);
    }

    async dateStep(step) {
        const mobNum = step.result;

        return await step.prompt('DATE_TIME_PROMPT', 'Please tell us when did the issue occured?');
    }


    async contactStep(step) {
        console.log(step.result);
        if (step.result[0].type == 'time'){
            const moment = require('moment');
            console.log(moment().format('YYYY-MM-DD' + step.result[0].timex));
        }
        
        return await step.endDialog('SCENARIO1_DIALOG');
    }

    async mobileValidator(context){
        let regMobNum = /[0-9]{10,11}/;
        if(context.recognized.succeeded){
            let result = context.recognized.value;
            if (result.match(regMobNum)){
            return true;
            }
        }
        else {
            return false;
        }   
    }
}

module.exports.Scenario1Dialog = Scenario1Dialog;