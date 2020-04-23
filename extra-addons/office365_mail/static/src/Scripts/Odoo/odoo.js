/* ------------------- */
/*     Odoo Object     */
/* ------------------- */
// Contains all the read write operations with an external odoo server
var odoo = {};

/* --- Static variables --- */
odoo.dbEndPoint = '/xmlrpc/db';
odoo.objectEndPoint = '/xmlrpc/2/object';
odoo.commonEndPoint = '/xmlrpc/2/common';

/* --- Setup connection to Odoo --- */
// Expects an object with url, username and password + error and success callback functions
odoo.setupConnection = function (params) {
    var settings = params.office.context.roamingSettings;

    odoo.getDbName({
        db: params.db,
        url: params.url,
        success: function (db) {
            settings.set('odooDb', db);
            settings.saveAsync();

            odoo.getUserUid({
                url: params.url,
                db: db,
                username: params.username,
                password: params.password,
                success: function (uid) {
                    settings.set('odooUid', uid);
                    settings.saveAsync();

                    odoo.credentials = {
                        url: params.url,
                        password: params.password,
                        uid: uid,
                        db: db
                    };

                    odoo.checkIfModuleInstalled({
                        success: params.success,
                        error: function () { return params.error("Error - Odoo Module for this Add-In is not installed.") }
                    });
                },
                error: function () { return params.error("Error - Wrong Password and/or Username.") }
            });
        },
        error: function () { return params.error("Error - Could not connect to Odoo.") }
    });
}

/* --- Gets the database to work with --- */
// Expects an object with url + success and error callback functions
odoo.getDbName = function (params) {
    var url = params.url + odoo.dbEndPoint;

    // Odoo Online specific logic
    if (params.db) {
        params.success(params.db);
    }
    // Get database from xmlrpc endpoint
    else {
        $.xmlrpc({
            url: url,
            methodName: 'list',
            success: function (data) {
                params.success(data[0][0]);
            },
            error: params.error
        });
    }
}

/* --- Gets uid for a user --- */
// Expects an object with url, username, password and db + error and success callback functions
odoo.getUserUid = function (params) {
    var url = params.url + odoo.commonEndPoint;

    $.xmlrpc({
        url: url,
        methodName: 'authenticate',
        params: [params.db, params.username, params.password, {}],
        success: function (data) {
            var uid = data[0];

            if (uid !== false) {
                params.success(uid);
            } else {
                params.error();
            }
        },
        error: params.error
    });
}

/* --- Makes an execute_kw request --- */
// Expects an object with model, action, domain, fields + error and success callback functions
odoo.executeKw = function (params) {
    var url = odoo.credentials.url + odoo.objectEndPoint;

    $.xmlrpc({
        url: url,
        methodName: 'execute_kw',
        params:
            [
                odoo.credentials.db,
                odoo.credentials.uid,
                odoo.credentials.password,
                params.model,
                params.action,
                params.domain,
                params.fields
            ],
        success: params.success,
        error: params.error
    });
}

/* --- Checks if the odoo module for this Add-In is installed --- */
// Expects an object with error and success callback functions
odoo.checkIfModuleInstalled = function (params) {
    odoo.executeKw({
        model: 'ooc.ooc',
        action: 'is_installed',
        domain: [],
        fields: {},
        success: params.success,
        error: params.error
    });
}

odoo.getActionsAsync = function (params) {
    odoo.executeKw({
        model: 'ooc.creation.model',
        action: 'get_allowed_models',
        domain: [],
        fields: {},
        success: params.success,
        error: params.error
    });
}

/* --- Gets the available items for a model --- */
// Expects an object with model + error and success callback functions
odoo.getModelItemsAsync = function (params) {
    odoo.executeKw({
        model: 'ooc.message.model',
        action: 'get_allowed_items',
        domain: [{
            'model': params.model,
            'search': params.search || '',
            'title': params.title || ''
        }],
        fields: {},
        success: params.success,
        error: params.error
    });
}

/* --- Gets the available models --- */
// Expects an object with error and success callback functions
odoo.getModelsAsync = function (params) {
    odoo.executeKw({
        model: 'ooc.message.model',
        action: 'get_allowed_models',
        domain: [],
        fields: {},
        success: params.success,
        error: params.error
    });
}

/* --- Gets a specific item --- */
// Expects an object with model, id + error and success callback functions
odoo.createObject = function (params) {
    odoo.executeKw({
        model: params.model,
        action: 'create',
        domain: [params.domain],
        fields: {},
        success: function (data) {
            if (typeof data[0] === 'number' && (data[0] % 1) === 0) {
                params.success(data[0]);
            } else {
                params.error(data);
            }
        },
        error: params.error
    });
}

/* --- Attaches an email to an item in odoo --- */
// Expects an object with model, id, subject, body, optional attachments, token and ewsUrl + error and success callback functions
odoo.sendMail = function (params) {
    odoo.executeKw({
        model: 'ooc.ooc',
        action: 'create_mail',
        domain: [{
            'subject': params.subject,
            'body': params.body,
            'model': params.model,
            'res_id': parseInt(params.id),
            'subtype_id': 2,
            'message_type': 'comment',
            'token': params.token,
            'attachments': params.attachments || [],
            'ewsUrl': params.ewsUrl
        }],
        fields: {},
        success: function (data) {
            if (typeof data[0] === 'number' && (data[0] % 1) === 0) {
                params.success(data[0]);
            } else {
                params.error(data);
            }
        },
        error: params.error
    });
}