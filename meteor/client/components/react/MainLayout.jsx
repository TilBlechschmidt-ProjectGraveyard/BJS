import React from "react";
import {FlowRouter} from "meteor/kadira:flow-router";
import {mount} from "react-mounter";
import {genUUID} from "../../../imports/api/crypto/pwdgen";
import {Athlete as AthleteObj} from "../../../imports/api/logic/athlete";
import {Log} from "../../../imports/api/log";

function generateAthletes() {
    const athletes = {};

    for (let i = 0; i < 700; i++) {
        let uuid = genUUID();
        athletes[uuid] = new AthleteObj(new Log(), "Klaus" + i, "Schmidt" + i, 1999, true, "Q1y", "0", 20, [], uuid);
    }

    return athletes;
}

window.athletes = generateAthletes();
const athletes = window.athletes;
const athleteIDs = Object.keys(athletes);

class MainLayout extends React.Component {
    render() {
        return (
            <div className="page">
                <div className="page-content">
                    <div className="content-block autoWidthListBlock">
                        <Athletes/>
                    </div>
                </div>
            </div>
        );
    }
}

class Athletes extends React.Component {
    render() {
        return (
            <div className="list-block">
                <ul>
                    {athleteIDs.map((uuid) => <Athlete uuid={uuid} key={uuid}/>)}
                </ul>
            </div>
        );
    }
}

class Athlete extends React.Component {

    constructor(...args) {
        super(...args);

        this.state = athletes[this.props.uuid];

        this.handleClick = this.handleClick.bind(this);
    }

    shouldComponentUpdate(newProps, newState) {
        console.log("UPDATE", newProps, newState);
        return true;
    }

    handleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log("HANDLING CLICK");
        this.setState({firstName: "SomethingWeird"});
    }

    render() {
        const athlete = AthleteObj.fromObject(new Log(), this.state);
        return (
            <li className="accordion-item">
                <a href="" className="item-content item-link">
                    <div className="item-media"><Icon/></div>
                    <div className="item-inner">
                        <div className="item-title">{athlete.getFullName()}</div>
                    </div>
                </a>
                <div className="accordion-item-content">
                    Item 1 content ...
                    <button onMouseDown={this.handleClick}>
                        THIS IS A NICE BUTTON
                    </button>
                </div>
            </li>
        );
    }
}

class Icon extends React.Component {
    render() {
        return (
            <svg className="icon i-ok not-animated"
                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="i__circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="i__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
        );
    }
}

FlowRouter.route('/react', {
    action() {
        mount(MainLayout);
    },
});