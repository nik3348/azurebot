class NotificationProfile {
    constructor(email) {
        this.email = email;

        // The list of selected notifications
        this.notifySelected = [];
    }
}

module.exports.NotificationProfile = NotificationProfile;