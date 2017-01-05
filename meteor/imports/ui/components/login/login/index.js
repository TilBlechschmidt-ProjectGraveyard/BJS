import "./index.html";


Template.omni_login.onRendered(function () {
    console.log("omniLogin");
    document.getElementsByClassName("passwort-input")[0].focus();
});