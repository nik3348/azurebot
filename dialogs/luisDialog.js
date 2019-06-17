const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { QnAMaker, LuisRecognizer } = require('botbuilder-ai');
const { Scenario1Dialog } = require('./scenario1Dialog');
const { Scenario2Dialog } = require('./scenario2Dialog');
const { Scenario3Dialog } = require('./scenario3Dialog');
const { Scenario6Dialog } = require('./scenario6Dialog');
const { CheckStatusDialog } = require('./checkStatusDialog');

const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class LuisDialog extends ComponentDialog {
    constructor() {
        super('LUIS_DIALOG');

        try {
            this.recognizer = new LuisRecognizer({
                applicationId: process.env.LuisAppId,
                endpointKey: process.env.LuisAPIKey,
                endpoint: `https://${ process.env.LuisAPIHostName }`
            }, {}, true);
        } catch (err) {
            console.warn(`LUIS Exception: ${ err } Check your LUIS configuration`);
        }

        try {
            var endpointHostName = process.env.QnAEndpointHostName;
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
            console.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
        }

        this.addDialog(new Scenario1Dialog());
        this.addDialog(new Scenario2Dialog());
        this.addDialog(new Scenario3Dialog());
        this.addDialog(new Scenario6Dialog());
        this.addDialog(new CheckStatusDialog());
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.listenStep.bind(this),
            this.qnaStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async listenStep(step) {
        return await step.prompt(TEXT_PROMPT);
    }

    async qnaStep(step) {
        // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
        const recognizerResult = await this.recognizer.recognize(step.context);

        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult);
        await step.context.sendActivity(intent);

        if (intent === 'Scenario1') {
            return await step.beginDialog('SCENARIO1_DIALOG');
        } else if (intent === 'Scenario2') {
            return await step.beginDialog('SCENARIO2_DIALOG');
        } else if (intent === 'Scenario3') {
            return await step.beginDialog('SCENARIO3_DIALOG');
        } else if (intent === 'Scenario6') {
            return await step.beginDialog('SCENARIO6_DIALOG');
        } else if (intent === 'checkStatus') {
            return await step.beginDialog('CHECK_STATUS_DIALOG');
        }

        if (step.result !== 'notify' && step.result !== 'support') {
            const qnaResults = await this.qnaMaker.getAnswers(step.context);

            // If an answer was received from QnA Maker, send the answer back to the user.
            if (qnaResults[0]) {
                await step.context.sendActivity(qnaResults[0].answer);
                await console.log(qnaResults[0].answer);

                // If no answers were returned from QnA Maker, reply with help.
            } else {
                await step.context.sendActivity('I did not understand the question, please try a different phrasing. If the problem persist type "support" to contact support');
                await console.log('I did not understand the question, please try a different phrasing. If the problem persist type "support" to contact support');
            }
        }
        return await step.next();
    }

    async loopStep(step) {
        if (step.context.activity.text !== 'notify' && step.context.activity.text !== 'support') {
            return await step.replaceDialog('LUIS_DIALOG');
        } else {
            console.log('Qna loop end');
            return await step.endDialog('LUIS_DIALOG');
        }
    }
}

module.exports.LuisDialog = LuisDialog;
