FlowRouter.route('/', {
    action: function () {
        FlowRouter.go("/config");
        //TODO: Check if it is already configured and run the following if that is the case:
        //FlowRouter.go("/contest");
    }
});

let input = FlowRouter.group({
    prefix: '/contest'
});

input.route('/', {
    action: function () {
        BlazeLayout.render('table_main');
    }
});

input.route('/login', {
    action: function () {
        BlazeLayout.render('login', {
            login_fields: [
                "Gruppenleiter",
                "Station"
            ]
        });
    }
});