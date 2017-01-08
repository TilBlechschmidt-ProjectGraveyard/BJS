const startClasses = require('../../../../../imports/data/start_classes.json');

Template.startClassesPopup.helpers({
    name: "Klaus Müller"
});

Template.startClassesPopupContent.helpers({
    startClasses: startClasses
});