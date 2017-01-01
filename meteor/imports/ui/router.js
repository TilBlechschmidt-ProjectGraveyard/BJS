import {input_onload} from "./components/input/index";


FlowRouter.route('/', {
    action: function () {
        // FlowRouter.go("/config");
        //TODO: Check if it is already configured and run the following if that is the case:
        FlowRouter.go("/contest");
    }
});

let input = FlowRouter.group({
    prefix: '/contest'
});

input.route('/', {
    triggersEnter: input_onload,
    action: function () {
        BlazeLayout.render('input');
    }
});

input.route('/:athlete_id', {
    triggersEnter: input_onload,
    action: function (params) {
        BlazeLayout.render('input', {
            athlete_id: params.athlete_id
        });
    }
});

let output = FlowRouter.group({
    prefix: '/output'
});

output.route('/', {
    action: function () {
        BlazeLayout.render('output');
    }
});
