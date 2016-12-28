import {input_onload} from "./components/input/index";
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
    triggersEnter: input_onload,
    action: function () {
        BlazeLayout.render('input');
    }
});