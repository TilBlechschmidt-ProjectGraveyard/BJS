import React from "react";
import {FlowRouter} from "meteor/kadira:flow-router";
import {mount} from "react-mounter";
import {genUUID} from "../../../imports/api/crypto/pwdgen";
import {Athlete as AthleteObj} from "../../../imports/api/logic/athlete";
import {Log} from "../../../imports/api/log";


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
    getAthletes() {
        const athletes = [];

        console.log("Creating athletes");
        for (let i = 0; i < 1000; i++) {
            athletes.push(
                new AthleteObj(new Log(), "Klaus" + i, "Schmidt" + i, 1999, true, "Q1y", "0", 20, [], genUUID())
            );
        }
        console.log("done");

        return athletes;
    }

    render() {
        return (
            <div className="list-block">
                <ul>
                    {this.getAthletes().map((athlete) => <Athlete athlete={athlete} key={athlete.id}/>)}
                </ul>
            </div>
        );
    }
}

class Athlete extends React.Component {
    render() {
        return (
            <li className="accordion-item">
                <a href="" className="item-content item-link">
                    <div className="item-inner">
                        <div className="item-title">{this.props.athlete.getFullName()}</div>
                    </div>
                </a>
                <div className="accordion-item-content">Item 1 content ...</div>
            </li>
        );
    }
}

FlowRouter.route('/react', {
    action() {
        mount(MainLayout);
    },
});