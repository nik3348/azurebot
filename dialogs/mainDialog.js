const { LuisDialog } = require('./luisDialog');
const { NotifyDialog } = require('./notifyDialog');
const { SupportDialog } = require('./supportDialog');
const { ComponentDialog, WaterfallDialog, TextPrompt, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class MainDialog extends ComponentDialog {
    constructor(userState, logger) {
        super('MAIN_DIALOG');

        this.logger = logger;
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new NotifyDialog());
        this.addDialog(new SupportDialog());
        this.addDialog(new LuisDialog());

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.luisStep.bind(this),
            this.notifyStep.bind(this),
            this.supportStep.bind(this),
            this.endStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async luisStep(step) {
        await step.context.sendActivity('Hello, You can start asking me any question about MacroKiosk! or enter "support" so I could notify a support agent for your problem. You can also enter "notify" to subscribe to our notification service.');
        await console.log('Hello, You can start asking me any question about MacroKiosk! or enter "support" so I could notify a support agent for your problem. You can also enter "notify" to subscribe to our notification service.');
        if (step.context.activity.text != 'notify' && step.context.activity.text != 'support') {
            return await step.beginDialog('LUIS_DIALOG');
        }

        else {
            return await step.next();
        }
    }

    async notifyStep(step) {
        if (step.context.activity.text != 'notify') {
            return await step.next();
        }

        else {
            return await step.beginDialog('NOTIFY_DIALOG');
        }
    }

    async supportStep(step) {
        if (step.context.activity.text != 'support') {
            return await step.next();
        }

        else {
            return await step.beginDialog('SUPPORT_DIALOG');
        }
    }

    async endStep(step) {
        return await step.endDialog('MAIN_DIALOG');
    }
}

module.exports.MainDialog = MainDialog;