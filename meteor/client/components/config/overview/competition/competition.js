Template.competition.events({
    'click .title-input': function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
    }
});