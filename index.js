// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const path = require('path');
const restify = require('restify');
const moment = require('moment');

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState } = require('botbuilder');

// The bot.
const { QnABot } = require('./bots/qnaBot');
const { MainDialog } = require('./dialogs/mainDialog');

// Note: Ensure you have a .env file and include QnAMakerKnowledgeBaseId, QnAMakerEndpointKey and QnAMakerHost.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    await conversationState.delete(context);
};

adapter.use(async (context, next) => {
    // hook up a handler to process any outgoing activities sent during this turn
    context.onSendActivities(async (sendContext, activities, nextSend) => {
        if (activities[0].type === 'message') {
            const mysql = require('mysql2/promise');
            const connection = await mysql.createConnection({
                host: process.env.MySQLHost,
                user: process.env.MySQLUser,
                password: process.env.MySQLPassword,
                database: process.env.MySQLDatabase
            });
            const timestamp = moment(activities[0].localTimestamp).format('YYYY-MM-DD HH:mm:ss');
            const [rows] = await connection.execute('INSERT INTO transcript (conversationId, user, message, timestamp) VALUES (?, ?, ?, ?)', [activities[0].conversation.id, activities[0].from.name, activities[0].text, timestamp]);
            connection.end();
        }
        // pre-processing of outgoing activities
        await nextSend();
        // post-processing outgoing activities
    });

    await next();
});

const memoryStorage = new MemoryStorage();

// Create conversation state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Pass in a logger to the bot. For this sample, the logger is the console, but alternatives such as Application Insights and Event Hub exist for storing the logs of the bot.
const logger = console;
const conversationReferences = {};

// Create the main dialog.
const dialog = new MainDialog(userState, logger);
const bot = new QnABot(conversationState, userState, dialog, logger, conversationReferences);

// Create HTTP server
let server = restify.createServer();
server.use(restify.plugins.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open the emulator select "Open Bot"`);
    console.log(`\nSee https://aka.ms/connect-to-bot for more information`);
});

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await bot.run(turnContext);
    });
});

server.get('/api/notify', async (req, res) => {
    for (let conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async turnContext => {
            await turnContext.sendActivity(req.query.MSG);
        });
    }

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
    res.end();
});
