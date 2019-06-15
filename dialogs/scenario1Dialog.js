const { ComponentDialog, WaterfallDialog, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const Recognizers = require('@microsoft/recognizers-text-suite');

class Scenario1Dialog extends ComponentDialog {
    constructor() {
        super('SCENARIO1_DIALOG');

        this.addDialog(new TextPrompt('TEXT_PROMPT'));
        this.addDialog(new NumberPrompt('NUMBER_PROMPT'));
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
        return await step.prompt('NUMBER_PROMPT', 'Please provide the mobile number');
    }

    async dateStep(step){
        const mobNumber = step.result;
        console.log(mobNumber);
        return await step.prompt('TEXT_PROMPT', 'Please tell us when did the issue occured?');
    }


    async contactStep(step) {
        try {
            const results = Recognizers.recognizeDateTime(step.result, Recognizers.Culture.English);
            const now = new Date();
            results.forEach(result => {
                // result.resolution is a dictionary, where the "values" entry contains the processed input.
                result.resolution['values'].forEach(resolution => {
                    // The processed input contains a "value" entry if it is a date-time value, or "start" and
                    // "end" entries if it is a date-time range.
                    const datevalue = resolution['value'] || resolution['start'];
                    // If only time is given, assume it's for today.
                    const datetime = resolution['type'] === 'time' ? new Date(`${ now.toLocaleDateString() } ${ datevalue }`) : new Date(datevalue);
                    console.log(datetime.toLocaleDateString());
                    return;
                });
            });


            return await step.endDialog('SCENARIO1_DIALOG');
        } catch (error) {
            await step.context.sendActivity('I am sorry I dont understand the date given.');
            return await step.endDialog('SCENARIO1_DIALOG');
        }
    }
}

module.exports.Scenario1Dialog = Scenario1Dialog;