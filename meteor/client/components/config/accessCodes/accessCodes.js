Meteor.test = new ReactiveVar([
    {
        name: "Stationspasswörter",
        codes: [
            {title: "Weitsprung", code: "Galifrey1337Kartoffel"},
            {title: "Hochsprung", code: undefined},
        ]
    },
    {name: "Gruppenpasswörter"},
    {name: "Eigene Zugangsdaten"},
]);

Template.accessCodes.helpers({
    codeGroups: function () {
        return Meteor.test.get();
    }
});

Template.accessCodes.animations({
    ".item": {
        container: ".container", // container of the ".item" elements
        insert: {
            class: "fade-open", // class applied to inserted elements
            before: function (attrs, element, template) {
            }, // callback before the insert animation is triggered
            after: function (attrs, element, template) {
            }, // callback after an element gets inserted
            // delay: 500 // Delay before inserted items animate
        },
        remove: {
            class: "fade-out", // class applied to removed elements
            before: function (attrs, element, template) {
                console.log("hiding");
            }, // callback before the remove animation is triggered
            after: function (attrs, element, template) {
                console.log("hidden");
            }, // callback after an element gets removed
            // delay: 500 // Delay before removed items animate
        },
        animateInitial: true, // animate the elements already rendered
        animateInitialStep: 200, // Step between animations for each initial item
        animateInitialDelay: 500 // Delay before the initial items animate
    }
});