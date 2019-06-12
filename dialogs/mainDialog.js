const { QnAMaker } = require('botbuilder-ai');
const { NotifyDialog } = require('./notifyDialog');
const { SupportDialog } = require('./supportDialog');
const { ComponentDialog, WaterfallDialog, TextPrompt, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

class MainDialog extends ComponentDialog {
    constructor(userState, logger) {
        super('MAIN_DIALOG');

        try {
            var endpointHostName = process.env.QnAEndpointHostName
            if (!endpointHostName.startsWith('https://')) {
                endpointHostName = 'https://' + endpointHostName;
            }

            if (!endpointHostName.endsWith('/qnamaker')) {
                endpointHostName = endpointHostName + '/qnamaker';
            } this.qnaMaker = new QnAMaker({
                knowledgeBaseId: process.env.QnAKnowledgebaseId,
                endpointKey: process.env.QnAAuthKey,
                host: endpointHostName
            });
        } catch (err) {
            logger.warn(`QnAMaker Exception: ${err} Check your QnAMaker configuration in .env`);
        }
        this.logger = logger;
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new NotifyDialog());
        this.addDialog(new SupportDialog());

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.listenStep.bind(this),
            this.qnaStep.bind(this),
            this.notifyStep.bind(this),
            this.supportStep.bind(this),
            this.loopStep.bind(this)
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

    async listenStep(step) {
        return await step.prompt(TEXT_PROMPT, 'You can start asking me any question about MacroKiosk! or enter "support" so I could notify a support agent for your problem. You can also enter "notify" to subscribe to our notification service.');
    }

    async qnaStep(step) {
        if (step.result != 'notify' && step.result != 'support') {
            const qnaResults = await this.qnaMaker.getAnswers(step.context);

            // If an answer was received from QnA Maker, send the answer back to the user.
            if (qnaResults[0]) {
                await step.context.sendActivity(qnaResults[0].answer);

                // If no answers were returned from QnA Maker, reply with help.
            } else {
                await step.context.sendActivity('No QnA Maker answers were found.');
            }
        }
        
        return await step.next();
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

    async loopStep(step) {
        return await step.replaceDialog('MAIN_DIALOG');
    }

}

module.exports.MainDialog = MainDialog;