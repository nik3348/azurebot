class NotificationProfile {
    constructor(email) {
        this.email = email;

        // The list of companies the user wants to review.
        this.notifySelected = [];
    }
}

module.exports.NotificationProfile = NotificationProfile;