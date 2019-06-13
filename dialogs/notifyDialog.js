const { ComponentDialog, WaterfallDialog, ChoicePrompt, TextPrompt, ConfirmPrompt } = require('botbuilder-dialogs');
const { NotificationProfile } = require('../notificationProfile');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

class NotifyDialog extends ComponentDialog {
    constructor() {
        super('NOTIFY_DIALOG');

        // Define a "done" response for the company selection prompt.
        this.doneOption = 'done';

        // Define value names for values tracked inside the dialogs.
        this.notificationSelected = 'value-notificationSelected';

        // Define the company choices for the company selection prompt.
        this.notifyOptions = ['Company Events', 'Software Updates'];
        
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.selectionStep.bind(this),
            this.loopStep.bind(this),
            this.emailStep.bind(this),
            this.confirmStep.bind(this),
            this.nextDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async selectionStep(stepContext) {
        // Continue using the same selection list, if any, from the previous iteration of this dialog.
        const list = Array.isArray(stepContext.options) ? stepContext.options : [];
        stepContext.values[this.notificationSelected] = list;

        // Create a prompt message.
        let message = '';
        if (list.length === 0) {
            message = `Please choose the notifications you want to recieve, or \`${ this.doneOption }\` to finish.`;
        } else {
            message = `You have selected **${ list[0] }**. You can select additional notifications, or choose \`${ this.doneOption }\` to finish.`;
        }

        // Create the list of options to choose from.
        const options = list.length > 0
            ? this.notifyOptions.filter(function(item) { return item !== list[0]; })
            : this.notifyOptions.slice();
        options.push(this.doneOption);

        // Prompt the user for a choice.
        await console.log(message);
        await console.log(options);
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: message,
            retryPrompt: 'Please choose an option from the list.',
            choices: options
        });
    }

    async loopStep(stepContext) {
        // Retrieve their selection list, the choice they made, and whether they chose to finish.
        const list = stepContext.values[this.notificationSelected];
        const choice = stepContext.result;
        const done = choice.value === this.doneOption;

        if (!done) {
            // If they chose a notification, add it to the list.
            list.push(choice.value);
        }

        if (done || list.length > 1) {
            // If they're done, exit and return their list.
            return await stepContext.next(list);
        }
        else if (done && list.length == 0){
            // If no option is selected exit.
            await stepContext.context.sendActivity('No options selected, notification registration canceled');
            await console.log('No options selected, notification registration canceled');
            return await stepContext.endDialog('NOTIFY_DIALOG');
        } 
        else {
            // Otherwise, repeat this dialog, passing in the list from this iteration.
            return await stepContext.replaceDialog('NOTIFY_DIALOG', list);
        }
    }

    async emailStep(stepContext) {
        stepContext.values.notifyInfo = new NotificationProfile();
        stepContext.values.notifyInfo.notifySelected = stepContext.result || [];

        await console.log(`What is your email?`);
        return await stepContext.prompt(TEXT_PROMPT, `What is your email?`);
    }

    async confirmStep(stepContext) {
        stepContext.values.notifyInfo.email = stepContext.result;
        await stepContext.context.sendActivity(stepContext.values.notifyInfo.email);

        await console.log('Is this your email?');
        return await stepContext.prompt(CONFIRM_PROMPT, 'Is this your email?', ['yes', 'no']);
        
    }

    async nextDialogStep(stepContext) {
        //If yes
        if (stepContext.result){
            await stepContext.context.sendActivity('Your email ' + stepContext.values.notifyInfo.email + ' has been sucessfully registered to receive notifications.');
            await console.log('Your email ' + stepContext.values.notifyInfo.email + ' has been sucessfully registered to receive notifications.');

            await stepContext.context.sendActivity('You will now receive notfications about ' + (stepContext.values.notifyInfo.notifySelected.length === 0 ? 'No notifications selected' : stepContext.values.notifyInfo.notifySelected.join(' and ')) + '.');
            await console.log('You will now receive notfications about ' + (stepContext.values.notifyInfo.notifySelected.length === 0 ? 'No notifications selected' : stepContext.values.notifyInfo.notifySelected.join(' and ')) + '.');

            return await stepContext.endDialog('NOTIFY_DIALOG');
        }
        else {
            await stepContext.context.sendActivity('Notification registration canceled');
            await console.log('Notification registration canceled');
            
            return await stepContext.endDialog('NOTIFY_DIALOG');
        }
    }
}

module.exports.NotifyDialog = NotifyDialog;