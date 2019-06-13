const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const { QnAMaker } = require('botbuilder-ai');

const TEXT_PROMPT = 'TEXT_PROMPT';

class QnaDialog extends ComponentDialog {
    constructor() {
        super('QNA_DIALOG');

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
            console.warn(`QnAMaker Exception: ${err} Check your QnAMaker configuration in .env`);
        }

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.listenStep.bind(this),
            this.qnaStep.bind(this),
            this.loopStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async listenStep(step) {
        return await step.prompt(TEXT_PROMPT);
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

    async loopStep(step) {
        if (step.context.activity.text != 'notify' && step.context.activity.text != 'support') {
            return await step.replaceDialog('QNA_DIALOG');
        }
        else {
            console.log('Qna loop end');
            return await step.endDialog('QNA_DIALOG');
        }
    }

}

module.exports.QnaDialog = QnaDialog;