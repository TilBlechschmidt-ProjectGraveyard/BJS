const output = FlowRouter.group({
    prefix: '/output'
});

output.route('/', {
    action: function () {
        BlazeLayout.render('output');
    }
});
