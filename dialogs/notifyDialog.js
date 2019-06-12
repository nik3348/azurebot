const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class NotifyDialog extends ComponentDialog {
    constructor() {
        super('NOTIFY_DIALOG');

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.nextDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(stepContext) {

        await stepContext.context.sendActivity(`Enter email`);
        return await stepContext.next();
    }

    async nextDialogStep(stepContext) {

        await stepContext.context.sendActivity(`Email saved`);

        return await stepContext.endDialog('NOTIFY_DIALOG');
    }
}

module.exports.NotifyDialog = NotifyDialog;