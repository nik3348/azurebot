const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class SupportDialog extends ComponentDialog {
    constructor() {
        super('SUPPORT_DIALOG');

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.contactStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async contactStep(stepContext) {
        // Create an object in which to collect the user's information within the dialog.
        await stepContext.context.sendActivity(`Support Contacted!`);
        return await stepContext.endDialog('SUPPORT_DIALOG');
    }

}

module.exports.SupportDialog = SupportDialog;