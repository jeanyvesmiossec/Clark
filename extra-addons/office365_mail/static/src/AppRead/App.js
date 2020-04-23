// See LICENSE file for full copyright and licensing details.

/// <reference path="App.js" />
// Common app functionality
var app = (function () {
    'use strict';

    var app = {};
    
    // Common initialization function (to be called from each page)
    app.initialize = function (office) {
        app.office = office;
        app.settings = office.context.roamingSettings;
     
        app.loadSettings();
    };

    app.loadSettings = function () {
        app.odooUrl = app.settings.get("odooUrl");
        app.odooUsername = app.settings.get("odooUsername");
        app.odooPassword = app.settings.get("odooPassword");
        app.odooDb = app.settings.get("odooDb");
        app.odooManualDb = app.settings.get("odooManualDb");
        app.odooUid = app.settings.get("odooUid");
    };

    return app;
})();