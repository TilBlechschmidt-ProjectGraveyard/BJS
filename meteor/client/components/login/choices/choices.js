import {Template} from "meteor/templating";
import "./choices.html";
import "./choices.css";
import {Server} from "../../../../imports/api/database/ServerInterface";

let db_tracker_tracker = new Tracker.Dependency();

Template.choices.helpers({
    contest_notice: function () {
        db_tracker_tracker.depend();
        if (!Server.db.isReady()) {
            return "Laden...";
        } else {
            return 'Wählen Sie eine der obigen Optionen, um Ihr Gerät für die Bundesjugendspiele "' + Server.contest.get().name + '" bereit zu machen.';
        }
    }
});

Server.db.waitForReady(function () {
    db_tracker_tracker.changed();
});