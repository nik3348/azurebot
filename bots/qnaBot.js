// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, TurnContext } = require('botbuilder');
const moment = require('moment');

class QnABot extends ActivityHandler {
    /**
     * @param {any} logger object for logging events, defaults to console if none is provided
     */
    constructor(conversationState, userState, dialog, logger, conversationReferences) {
        super();
        // For notification
        // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
        this.conversationReferences = conversationReferences;

        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);

            await next();
        });

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        if (!logger) {
            logger = console;
            logger.log('[DialogBot]: logger not passed in, defaulting to console');
        }

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.logger = logger;
        this.dialogState = this.conversationState.createProperty('DialogState');

        // If a new user is added to the conversation, send them a greeting message
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to the chat! I am ChatBot made to answer the questions you have about MacroKiosk.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            // this.logger.log('Running dialog with Message Activity.');
            this.addConversationReference(context.activity);
            const mysql = require('mysql2/promise');
            const connection = await mysql.createConnection({
                host: process.env.MySQLHost,
                user: process.env.MySQLUser,
                password: process.env.MySQLPassword,
                database: process.env.MySQLDatabase
            });
            const timestamp = moment(context.activity.localTimestamp).format('YYYY-MM-DD HH:mm:ss');
            const [rows] = await connection.execute('INSERT INTO transcript (conversationId, user, message, timestamp) VALUES (?, ?, ?, ?)', [context.activity.conversation.id, context.activity.from.name, context.activity.text, timestamp]);
            // Run the Dialog with the new message Activity.
            connection.end();
            await this.dialog.run(context, this.dialogState);
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
    }

    async addConversationReference(activity) {
        const conversationReference = TurnContext.getConversationReference(activity);
        const cRef = {
            user: null,
            bot: null,
            conversation: { id: conversationReference.conversation.id },
            channelId: conversationReference.channelId,
            serviceUrl: conversationReference.serviceUrl
        };
        this.conversationReferences[conversationReference.conversation.id] = cRef;
    }
}

module.exports.QnABot = QnABot;
