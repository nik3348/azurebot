const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class CheckStatusDialog extends ComponentDialog {
    constructor() {
        super('CHECK_STATUS_DIALOG');

        this.addDialog(new TextPrompt('TEXT_PROMPT', this.statusIdValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.statusIdStep.bind(this),
            this.validationStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async statusIdStep(step) {
        const pOptions = { prompt: 'May I know the status number?', retryPrompt: 'Please ensure than the status number follows the format RN-XXXX' };
        return await step.prompt('TEXT_PROMPT', pOptions);
    }

    async validationStep(step) {
        return await step.endDialog('CHECK_STATUS_DIALOG');
    }

    async statusIdValidator(context) {
        let regstatusID = /[A-Z]{2}-[0-9]{4,10}/;
        if (context.recognized.succeeded) {
            let result = context.recognized.value;
            if (result.match(regstatusID)) {
                return true;
            }
        } else {
            return false;
        }
    }
}

module.exports.CheckStatusDialog = CheckStatusDialog;
