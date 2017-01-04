import {Template} from "meteor/templating";
import "./index.html";
import {DBInterface} from "../../../../api/database/db_access";

let db_tracker_tracker = new Tracker.Dependency();

Template.choices.helpers({
    competition_notice: function () {
        db_tracker_tracker.depend();
        if (!DBInterface.isReady()) {
            return "Laden...";
        } else {
            return 'Wählen Sie eine der obigen Optionen, um Ihr Gerät für die Bundesjugendspiele "' + DBInterface.getCompetitionName() + '" bereit zu machen.';
        }
    }
});

DBInterface.waitForReady(function () {
    db_tracker_tracker.changed();
});