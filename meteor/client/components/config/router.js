FlowRouter.route('/config', {
    action: function () {
        BlazeLayout.render('config', {});
    }
});

FlowRouter.route('/codes', {
    action: function () {
        BlazeLayout.render('accessCodes', {});
    }
});