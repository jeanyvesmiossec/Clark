// See LICENSE file for full copyright and licensing details.

/// <reference path="../App.js" />
// global app
(function () {
    'use strict';

    var _spinner;

    // The Office initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            app.initialize(Office);

            translations.init(Office.context.displayLanguage.substring(0, 2));

            $('body').show();

            fillFields();
            checkManualDatabase();
            bindEvents();
            bindComponents();
            checkConnection();
        });
    };

    /* --- Binding --- */
    function bindEvents() {
        $('#form-settings').submit(onSettingsSubmit);
        $('#open-confirm-dialog').click(onOpenConfirmDialog);
        $('#save-changes').click(onSaveChangesClick);
        $('#odoo-base-url').change(onURLChange)
    }

    function bindComponents() {
        $('#confirm-dialog').Dialog();
        _spinner = fabric.Spinner(document.querySelector('.ms-Spinner'));
    }

    /* --- Events --- */
    function onOpenConfirmDialog() {
        var dbFieldNode = $('#odoo-database')
        var dbFieldVisible = dbFieldNode.is(':visible')
        var odooDatabase = dbFieldNode.val()

        var odooUrl = $('#odoo-base-url').val()
        var odooUsername = $('#odoo-username').val()
        var odooPassword = $('#odoo-password').val()

        if (
            (dbFieldVisible && app.odooManualDb !== odooDatabase) ||
            app.odooUrl !== odooUrl ||
            app.odooUsername !== odooUsername ||
            app.odooPassword !== odooPassword ||
            odooPassword === ''
        ) {
            $('#confirm-dialog').show();
        }
    }

    function onURLChange(e) {
        var odooUrl = $('#odoo-base-url').val()

        // Odoo Online specific logic
        if (isOdooOnlineUrl(odooUrl)) {
            $('#odoo-database-field').show()
        } else {
            $('#odoo-database-field').hide()
        }
    }

    function onSettingsSubmit(e) {
        e.preventDefault();
    }

    function onSaveChangesClick(e) {
        showLoading();

        var dbFieldNode = $('#odoo-database')
        var dbFieldVisible = dbFieldNode.is(':visible')
        var odooManualDb = dbFieldVisible ? dbFieldNode.val() : ""

        var odooUrl = formatUrl($('#odoo-base-url').val());
        var odooUsername = $('#odoo-username').val()
        var odooPassword = $('#odoo-password').val() || app.settings.get('odooPassword')

        if (isValidUrl(odooUrl)) {
            if (odooUrl !== "") app.settings.set('odooUrl', odooUrl);
            if (odooUsername !== "") app.settings.set('odooUsername', odooUsername);
            if (odooPassword !== "") app.settings.set('odooPassword', odooPassword);

            if (dbFieldVisible) {
                if (odooManualDb !== "") app.settings.set('odooManualDb', odooManualDb);
            } else {
                app.settings.set('odooManualDb', '');
            }

            app.settings.saveAsync(function () {
                app.loadSettings();

                checkConnection(function () {
                    $('#reopen-dialog').delay(900).show(0);
                });
            });
        } else {
            showConnectionError("Error - Not a valid url");
        }
    }

    /* --- Add Content --- */
    function fillFields() {
        if (app.odooUrl !== undefined) {
            $('#odoo-base-url').val(app.odooUrl)
        } else {
            $('#odoo-base-url').val(window.location.origin);
        }
        if (app.odooUsername !== undefined) $('#odoo-username').val(app.odooUsername);
        if (app.odooManualDb !== undefined) $('#odoo-database').val(app.odooManualDb);
        if (app.odooPassword !== undefined) $('#odoo-password').attr('placeholder', "********");
    }

    function checkConnection(onSuccess) {
        showLoading();

        odoo.setupConnection({
            office: Office,
            db: app.odooManualDb,
            url: app.odooUrl,
            username: app.odooUsername,
            password: app.odooPassword,
            success: function () {
                showConnectionSuccess();
                if(onSuccess) onSuccess();
            },
            error: showConnectionError
        });
    }

    function checkManualDatabase() {
        if (app.odooUrl ? isOdooOnlineUrl(app.odooUrl) : isOdooOnlineUrl(window.location.origin)) {
            $('#odoo-database-field').show()
        }
    }

    /* --- Show Content --- */
    function showConnectionError(message) {
        $('#spinner').fadeTo(100, 0).hide('fast', function () { $('#message-error').show().find('.ms-MessageBar-text').text(message) });
        _spinner.stop();
    }

    function showConnectionSuccess() {
        $('#spinner').fadeTo(600, 0).hide('fast', function () { $('#message-success').show(); _spinner.stop(); });

    }

    function showLoading() {
        _spinner.start();
        $('#message-error').hide();
        $('#message-success').hide();
        $('#spinner').show().fadeTo(300, 1);
    }

    /* --- Helper Functions --- */
    function formatUrl(url) {
        url = url.replace(/^http?:\/\//, 'https://');
        url = url.replace(/\\/g, '/')
        url = url.replace(/\/*\s*$/g, '');

        if (!url.match(/^https:\/\//)) {
            url = 'https://' + url;
        }

        return url;
    }

    function isValidUrl(url) {
        return !url.match(/(:.*:)|(\/\/.*\/\/)|\s/g);
    }

    function isOdooOnlineUrl(url) {
        return url.endsWith("odoo.com") || url.endsWith("odoo.com/")
    }
})();