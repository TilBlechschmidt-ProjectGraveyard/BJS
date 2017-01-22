import React from "react";
import {FlowRouter} from "meteor/kadira:flow-router";
import {mount} from "react-mounter";


MainLayout = React.createClass({
    render() {
        return (
            <div>
                <header><h1>Kadira Blog</h1></header>
                <main>{this.props.content}</main>
                <footer>We love Meteor</footer>
            </div>
        );
    }
});

BlogHome = React.createClass({
    render() {
        return (
            <div>
                <p>This is the home page of our blog</p>
                <p>
                    <a href="/react/hello-world">See Hello World Post</a>
                </p>
            </div>
        );
    }
});

BlogPost = React.createClass({
    render() {
        return (
            <div>
                <p>
                    <a href="/react">Back</a> <br/>
                    This is a single blog post
                </p>
            </div>
        );
    }
});

FlowRouter.route('/react', {
    action() {
        mount(MainLayout, {content: <BlogHome />});
    },
});

FlowRouter.route('/react/:postId', {
    action(params) {
        mount(MainLayout, {content: <BlogPost {...params} />});
    }
});