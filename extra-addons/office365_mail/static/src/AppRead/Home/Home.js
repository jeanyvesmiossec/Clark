// See LICENSE file for full copyright and licensing details.

/// <reference path="../App.js" />
// global app

(function () {
    'use strict';

    var _currentItem;
    var _currentAction;
    var _customProperties;
    var _actions;

    // The Office initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            app.initialize(Office);

            _currentItem = Office.context.mailbox.item;

            translations.init(Office.context.displayLanguage.substring(0, 2));

            doc.init();
            home.init();
            acp.init();
        });
    };



    /* ------------------ */
    /*     Doc Object     */
    /* ------------------ */
    // Contains all the repeatedly used jQuery and Fabric Objects.
    var doc = {};

    /* --- Static fields --- */
    doc.title = $('h1');

    /* --- Buttons --- */
    doc.attachButton = $('#attach');
    doc.createButton = $('#create');
    doc.attachNewButton = $('#attach-new');
    doc.cancelButton = $('.cancel');
    doc.searchBoxClear = $('.ms-SearchBox-closeButton');
    doc.buttonShowInfo = $('#button-info');
    doc.buttonShowAttach = $('#button-attach');

    /* --- Select --- */
    doc.modelSelect = $('#models select');
    doc.modelSelecter = $('#models');
    doc.modelItemSelecter = $('#model-items');

    /* --- List --- */
    doc.createAttachmentList = $('#create-attachment-list');
    doc.attachAttachmentList = $('#attach-attachment-list');
    doc.attachmentLists = $('.attachment-list');

    /* --- Text Input --- */
    doc.attachSubjectInput = $('#email-subject');
    doc.attachBodyInput = $('#email-body');
    doc.createSubjectInput = $('#create-subject');
    doc.createBodyInput = $('#create-body');
    doc.searchBox = $('#search-model-items');

    /* --- Areas --- */
    doc.attachField = $('#attach-field');
    doc.loadingField = $('#loading-field');
    doc.infoField = $('#info-field');
    doc.commandField = $('#command-field');
    doc.createField = $('#create-field');
    doc.createActionsField = $('#create-actions');

    /* --- Messages --- */
    doc.attachingLoadingField = $('#attach-loading');
    doc.attachingSuccessField = $('#attach-success');
    doc.attachingErrorField = $('#attach-error');
    doc.createLoadingField = $('#create-loading');
    doc.createSuccessField = $('#create-success');
    doc.createErrorField = $('#create-error');
    doc.errorField = $('#error-field');
    doc.infoTableTable = $('#info-table table');
    doc.infoTableMessage = $('#info-table p');


    /* --- Init --- */
    doc.init = function () {
        doc.bindComponents();
    }

    /* --- Binding --- */
    doc.bindComponents = function () {
        doc.loadingSpinner = fabric.Spinner(document.querySelector('#loading-field .ms-Spinner'));
        doc.attachLoadingSpinner = fabric.Spinner(document.querySelector('#attach-loading.ms-Spinner'));
        doc.createLoadingSpinner = fabric.Spinner(document.querySelector('#create-loading.ms-Spinner'));
    }


    /* ------------------- */
    /*     Home Object     */
    /* ------------------- */
    // Contains the general flow of input and output of the home.html page.
    var home = {};


    /* --- Init --- */
    home.init = function () {
        home.loadProperties(function () {
            home.bindEvents();
            home.bindComponents();
            home.checkConnection(home.checkIfFirstRun(), function () {
                app.loadSettings();
                home.addContent();
                home.showCommands();
            });
        });
    }


    /* --- Binding --- */
    home.bindEvents = function () {
        doc.attachNewButton.on('click', home.showAttach);
        doc.cancelButton.on('click', home.onCancel);
        doc.attachButton.on('click', home.onAttachClick);
        doc.createButton.on('click', home.onCreateClick);
        doc.buttonShowAttach.on('click', home.showAttach);
        doc.buttonShowInfo.on('click', function () { home.showInfo() });
        doc.modelSelect.on('change', home.onSelectModelChange);
        doc.infoField.on('click', '.clickable', home.onAttachedItemClick);
        doc.createActionsField.on('click', '.clickable', home.onActionCreateClick);
        doc.modelSelecter.on('click', '.ms-Dropdown-title', home.onModelSelectorFocus);
    }

    home.bindComponents = function () {
        $(".ms-Dropdown").Dropdown();
        $(".ms-SearchBox").SearchBox();
    }


    /* --- Events --- */
    home.onAttachClick = function (e) {
        e.preventDefault();

        var id = acp.selectedItem;
        var model = doc.modelSelecter.find('.is-selected').attr('data-model');

        if (id && model) {
            home.showAttachingLoading();
            home.sendMail({
                id: id,
                model: model,
                body: home.toHtml(doc.attachBodyInput.val()),
                subject: doc.attachSubjectInput.val(),
                list: doc.attachAttachmentList,
                success: function () {
                    home.addAttachedItem({
                        name: doc.searchBox.val(),
                        id: id,
                        model: {
                            name: model,
                            display_name: doc.modelSelecter.find('.is-selected').text()
                        }
                    });

                    home.showInfo('attach');
                },
                error: function (error) {
                    console.log(error);
                    home.showAttachingError();
                }
            });
        } else {
            if (!model) {
                doc.modelSelecter.find('.ms-Dropdown-title').addClass('input-error');
            }

            doc.searchBox.addClass('input-error');
        }
    }

    home.onCancel = function (e) {
        e.preventDefault();

        home.showCommands();
    }

    home.onSelectModelChange = function () {
        home.loadModelItems(doc.modelSelecter.find('.is-selected').attr('data-model'));
    }

    home.onAttachedItemClick = function () {
        var model = $(this).attr('data-model');
        var item = $(this).attr('data-item');

        window.open(app.odooUrl + '/redirect/' + model + '/' + item, '_blank');
    }

    home.onActionCreateClick = function () {
        var clickedId = $(this).data('action');
        _currentAction = false;

        for (var i = 0; i < _actions.length; i++) {
            var action = _actions[i];

            if (action.id == clickedId) {
                _currentAction = action;
                break;
            }
        }

        if (_currentAction !== false) {
            $('[data-object-name]').text(_currentAction.name);
            $('[data-body-title]').text(_currentAction.message_field_title || _currentAction.message_field_id[1]);
            $('[data-subject-title]').text(_currentAction.subject_field_title || _currentAction.subject_field_id[1]);

            home.showCreate(_currentAction.name);
        }
    }

    home.onCreateClick = function (e) {
        e.preventDefault();

        home.showCreatingLoading();

        var params = {};
        params.model = _currentAction.model_name;
        params.domain = {}
        params.domain[_currentAction.subject_field_name] = doc.createSubjectInput.val();

        params.domain[_currentAction.message_field_name] = _currentAction.message_field_type === 'html' ? '<p>' + home.toHtml(doc.createBodyInput.val()) + '</p>' : doc.createBodyInput.val();

        if (_currentAction.from_email_field_name) params.domain[_currentAction.from_email_field_name] = _currentItem.sender.emailAddress;
        if (_currentAction.from_name_field_name) params.domain[_currentAction.from_name_field_name] = _currentItem.sender.displayName;
        if (_currentAction.user_field_name) params.domain[_currentAction.user_field_name] = odoo.credentials.uid;

        params.error = function (error) {
            console.log(error);
            home.showCreatingError();
        }

        params.success = function (data) {
            _currentItem.body.getAsync(Office.CoercionType.Html, {}, function (result) {
                home.sendMail({
                    id: data,
                    model: params.model,
                    body: result.value,
                    subject: _currentItem.subject,
                    list: doc.createAttachmentList,
                    success: function () {
                        home.addAttachedItem({
                            name: doc.createSubjectInput.val(),
                            id: data,
                            model: {
                                name: params.model,
                                display_name: _currentAction.display_name
                            }
                        });

                        home.showInfo('create');
                    },
                    error: function (error) {
                        console.log(error);
                        home.showCreatingError();
                    }
                });
            });
        };

        odoo.createObject(params);
    }

    home.onModelSelectorFocus = function () {
        $(this).removeClass('input-error');
    }

    /* --- Add Content --- */
    home.addContent = function () {
        home.loadActions();
        home.loadModels();
        home.loadEmailFields();
        home.loadAttachments();
    }

    home.loadActions = function () {
        odoo.getActionsAsync({
            success: function (data) {
                _actions = data[0];

                var template = '<hr />' +
                    '<button data-action="{0}" class="clickable ms-Button ms-Button--command">' +
                    '<span class="ms-Button-icon"><i class="ms-Icon ms-Icon--plus"></i></span>' +
                    '<span class="ms-Button-label">' + translations.translate('Create') + ' {1}</span>' +
                    '</button>';

                for (var i = 0; i < _actions.length; i++) {
                    var action = _actions[i];

                    doc.createActionsField.append(template.replace('{0}', action.id).replace('{1}', action.name));
                }
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    home.loadEmailFields = function () {
        doc.attachSubjectInput.val(_currentItem.subject);
        doc.createSubjectInput.val(_currentItem.subject);

        _currentItem.body.getAsync(Office.CoercionType.Text, {}, function (result) {
            var body = home.cleanText(result.value);

            doc.attachBodyInput.text(body);
        });
    }

    home.loadModels = function () {
        odoo.getModelsAsync({
            success: function (data) {
                home.fillSelectModels(data[0]);
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    home.loadModelItems = function (model) {
        odoo.getModelItemsAsync({
            model: model,
            title: _currentItem.subject,
            success: function (data) {
                doc.searchBox.val('');
                doc.searchBox.focus();
                home.fillSelectItems(data[0]);
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    home.loadAttachments = function () {
        if (home.isAttachmentsSupported() && _currentItem.attachments.length !== 0) {
            doc.attachmentLists.empty();

            doc.attachmentLists.each(function () { home.fillAttachmentList($(this), _currentItem.attachments); });
        }
    }

    home.fillAttachmentList = function (list, data) {
        var template = '<div class="ms-ChoiceField">' +
            '<input class="ms-ChoiceField-input" data-id="{aid}" id="{id}" type="checkbox" checked="checked">' +
            '<label class="ms-ChoiceField-field" for="{id}"><span class="ms-Label">{display-name}</span></label>' +
            '</div>';

        for (var i = 0; i < data.length; i++) {
            var att = data[i];
            var id = Math.floor(Math.random() * 1000000000);

            list.append($(template.replace(/\{id}/g, id.toString()).replace(/\{display-name}/g, att.name).replace(/\{aid}/g, att.id.replace(/\/|\+|=/g, '_'))));
        }
    }

    home.fillSelectModels = function (data) {
        var selectModels = doc.modelSelecter.find('ul');

        selectModels.empty();

        var dataLength = data.length;

        for (var i = 0; i < dataLength; i++) {
            if(data[i].default) {
                selectModels.append('<li class="ms-Dropdown-item default-is-selected" data-model=' + data[i].model + '>' + data[i].name + '</li>');
            } else {
                selectModels.append('<li class="ms-Dropdown-item" data-model=' + data[i].model + '>' + data[i].name + '</li>');
            }
        }

        $(".default-is-selected").click()
    }

    home.fillSelectItems = function (data) {
        var selectModelItems = doc.modelItemSelecter.find('ul');

        selectModelItems.empty();

        var dataLength = data.length;
        var appended = 0;

        if(dataLength !== 0) {
            var isAttached = home.checkIfAttached();
            var list;

            if (isAttached) {
                list = home.getAttachedList().list;
            }

            for (var i = 0; i < dataLength; i++) {
                if (!isAttached || list.filter(function (value) { return value.id == data[i].id }).length === 0) {
                    if (data[i].default) {
                        selectModelItems.append('<li class="ms-Dropdown-item default-is-selected-item" data-id=' + data[i].id + '>' + data[i].display_name + '</li>');
                    } else {
                        selectModelItems.append('<li class="ms-Dropdown-item" data-id=' + data[i].id + '>' + data[i].display_name + '</li>');
                    }
                    appended++;
                }
            }
        }

        if (appended === 0) {
            selectModelItems.append('<li class="ms-Dropdown-item">' + translations.translate('No items for this model found...') + '</li>');
        }

        // setTimeout(function () {

        // }, 1500)

        // doc.searchBox.click()
        var defaultItemNode = $(".default-is-selected-item")

        if (defaultItemNode.length !== 0) {
            defaultItemNode.click()
            $('#model-items .ms-SearchBox-label').hide();
        }
    }

    home.fillInfo = function () {
        var table = doc.infoField.find('tbody');
        table.empty();

        var list;
        if (home.checkIfAttached()) {
            list = home.getAttachedList().list;
        }

        if (list && list.length > 0) {
            doc.infoTableTable.show();
            doc.infoTableMessage.hide();

            for (var i = 1; i <= list.length; i++) {
                var item = list[i - 1];

                table.append('<tr class="clickable" data-model="' + item.model.name + '" data-item="' + item.id + '" >' +
                    '<td>' + i + '</td>' +
                    '<td>' + item.model.display_name + '</td>' +
                    '<td>' + item.name + '</td>' +
                    '<td><a class="ms-Link">' + translations.translate('Open') + '</a></td>' +
                    '</tr>');
            }
        }
        else {
            doc.infoTableTable.hide();
            doc.infoTableMessage.show();
        }
    }


    /* --- Show Messages --- */
    home.showConnectionError = function () {
        doc.loadingField.fadeOut(300, function () {
            doc.errorField.fadeTo(300, 1);
        });
    }

    home.showAttachingLoading = function () {
        doc.attachButton.prop('disabled', true);
        doc.attachLoadingSpinner.start();
        doc.attachingErrorField.hide();
        doc.attachingLoadingField.show();
    }

    home.showAttachingError = function () {
        doc.attachingLoadingField.fadeOut(300, function () {
            doc.attachingErrorField.css({ opacity: 0, display: 'inline-block' }).animate({ opacity: 1 }, 300);
            doc.attachButton.prop('disabled', false);
        });
    }

    home.showCreatingLoading = function () {
        doc.createButton.prop('disabled', true);
        doc.createLoadingSpinner.start();
        doc.createErrorField.hide();
        doc.createLoadingField.show();
    }

    home.showCreatingError = function () {
        doc.createLoadingField.fadeOut(300, function () {
            doc.createErrorField.css({ opacity: 0, display: 'inline-block' }).animate({ opacity: 1 }, 300);
            doc.createButton.prop('disabled', false);
        });
    }

    /* --- Show Fields --- */
    home.hideFields = function (callback) {
        var time = 300;

        $('.field').fadeOut(time);

        setTimeout(function () {
            doc.loadingSpinner.stop();
            callback();
        }, time);
    }

    home.showCommands = function () {
        home.hideFields(function () {
            doc.title.text(translations.translate('Actions'));
            doc.commandField.fadeTo(300, 1);
        });
    }

    home.showAttach = function () {
        home.hideFields(function () {
            doc.title.text(translations.translate('Attach'));
            doc.attachField.fadeTo(300, 1);
        });
    }

    home.showCreate = function (object) {
        home.hideFields(function () {
            doc.title.text(translations.translate('Create') + ' ' + object);
            doc.createField.fadeTo(300, 1);
        });
    }

    home.showInfo = function (source) {
        home.fillInfo();

        var newItem = false;
        var loadingField;
        var successField;
        var reset;

        if (source === 'create') {
            newItem = true;
            loadingField = doc.createLoadingField;
            successField = doc.createSuccessField;
            reset = home.resetCreate;
        } else if (source === 'attach') {
            newItem = true;
            loadingField = doc.attachingLoadingField;
            successField = doc.attachingSuccessField;
            reset = home.resetAttach;
        }

        function show() {
            home.hideFields(function () {
                doc.title.text(translations.translate('Info'));

                if (reset) reset();
                doc.infoField.fadeIn(300);
            });
        }

        if (newItem) {
            loadingField.fadeOut(300, function () {
                successField.fadeIn(300);
                setTimeout(function () {
                    show();
                }, 1000);
            });
        } else {
            show();
        }
    }

    home.showModelItemsDropdown = function (bool) {
        if (bool === false && bool !== 'undefined') {
            doc.modelItemSelecter.removeClass('is-open');
        } else {
            doc.modelItemSelecter.addClass('is-open');
        }
    }

    home.resetAttach = function () {
        acp.reset();

        doc.attachingSuccessField.css({ 'opacity': '', 'display': 'none' });
        home.loadModels();
        home.loadEmailFields();
        doc.modelSelecter.find('.ms-Dropdown-title').text('Choose a model...');
        doc.attachButton.prop('disabled', false);
    }

    home.resetCreate = function () {
        doc.createSuccessField.css({ 'opacity': '', 'display': 'none' });
        home.loadEmailFields();
        doc.createButton.prop('disabled', false);
    }

    /* --- Odoo Connection --- */
    home.checkConnection = function (isNew, callback) {
        doc.title.text(translations.translate('Actions'));

        odoo.setupConnection({
            office: Office,
            url: app.odooUrl,
            db: app.odooManualDb,
            username: app.odooUsername,
            password: app.odooPassword,
            success: callback,
            error: function () {
                if (isNew) {
                    window.location.href = '../Settings/Settings.html'
                } else {
                    home.showConnectionError()
                }
            }
        });
    }

    home.sendMail = function (params) {
        if (params.list.find('input:checked').length === 0) {
            home.createMail(params);
        } else {
            if (home.isAttachmentsSupported()) {
                Office.context.mailbox.getCallbackTokenAsync(home.attachmentTokenCallback, params);
            }
            else {
                home.createMail(params);
            }
        }
    }

    home.attachmentTokenCallback = function (asyncResult) {
        if (asyncResult.status == "succeeded") {
            var params = asyncResult.asyncContext;
            params.token = asyncResult.value;

            home.attachToOdooWithAttachments(params);
        }
        else {
            console.log("Error", "Could not get callback token: " + asyncResult.error.message);
        }
    }

    home.attachToOdooWithAttachments = function (params) {
        var attachments = [];

        for (var i = 0; i < _currentItem.attachments.length; i++) {
            if (params.list.find('[data-id="' + _currentItem.attachments[i].id.replace(/\/|\+|\=/g, '_') + '"]')[0].checked) {
                var att = {
                    "id": _currentItem.attachments[i].id,
                    "name": _currentItem.attachments[i].name,
                    "size": _currentItem.attachments[i].size
                }
                attachments.push(JSON.parse(JSON.stringify(att)));
            }
        }

        params.ewsUrl = Office.context.mailbox.ewsUrl;
        params.attachments = attachments;

        home.createMail(params)
    }

    home.isAttachmentsSupported = function () {
        if (_currentItem.attachments == undefined) {
            console.log("Not supported", "Attachments are not supported by your Exchange server.");
        } else if (_currentItem.length == 0) {
            console.log("No attachments", "There are no attachments on this item.");
        } else {
            return true;
        }

        return false;
    }

    home.createMail = function (params) {
        delete params.list;

        params.body = params.body.replace('</body>', '') + '<br/><hr/>Original email from ' + _currentItem.sender.displayName + ' &lt;' + _currentItem.sender.emailAddress + '&gt;<br/><br/>Created with the <i><strong>Outlook Odoo Connector</strong></i> by <i><strong>Somko</strong></i><br/><br/>'

        odoo.sendMail(params);
    }


    /* --- Settings --- */
    home.loadProperties = function (callback) {
        _currentItem.loadCustomPropertiesAsync(function (result) {
            _customProperties = result.value;

            callback();
        });
    }

    home.checkIfAttached = function () {
        var isProp = !!_customProperties.get("attachedItems");

        if (isProp) {
            var item = home.getAttachedList();

            return isProp && !!item && item.list.length !== 0;
        }

        return false;
    }

    home.addAttachedItem = function (item) {
        var attachedItems = _customProperties.get("attachedItems");
        if (!attachedItems) attachedItems = [];

        var attListForUrl = home.getAttachedList();

        if (!attListForUrl) {
            attListForUrl = {};
            attListForUrl.name = app.odooUrl;
            attListForUrl.list = [];

            attachedItems.push(attListForUrl);
        }

        attListForUrl.list.push(item);

        _customProperties.set("attachedItems", attachedItems);
        _customProperties.saveAsync();
    }

    home.checkIfFirstRun = function () {
        var firstRunSetting = _customProperties.get("firstRun");
        var isFirstRun = false;

        if (!firstRunSetting) isFirstRun = true;

        _customProperties.set("firstRun", true);
        _customProperties.saveAsync();

        return isFirstRun;
    }

    home.getAttachedList = function () {
        if (!_customProperties.get('attachedItems')) return null;

        for (var i = 0; i < _customProperties.get('attachedItems').length ; i++) {
            if (_customProperties.get('attachedItems')[i].name === app.odooUrl) {
                return _customProperties.get('attachedItems')[i];
            }
        }

        return null;
    }

    home.cleanText = function (text) {
        var body = text.replace(/^\s+|\s+$|\v/g, '').replace(/[\n\r]{3,}/g, '\n').split(/[\r\n]/g);

        for (var i = 0; i < body.length; i++) {
            body[i] = body[i].replace(/^\s+/, '');
        }

        return body.join('\n');
    }

    home.toHtml = function (text) {
        return text.replace(/[\n\r]/g, '<br>')
    }

    /* --------------------------- */
    /*     Autocomplete Object     */
    /* --------------------------- */
    // Contains the logic for the item searchbox
    var acp = {};


    /* --- Static fields --- */
    acp.curr = 0;
    acp.timeout = 350; // Minimum value in miliseconds between external server calls


    /* --- Init --- */
    acp.init = function () {
        acp.bindEvents();
    }


    /* --- Binding --- */
    acp.bindEvents = function () {
        doc.searchBox.on('input', acp.onSearchBoxInput);
        doc.searchBox.on('blur', acp.onSearchBoxBlur);
        doc.searchBox.on('focus', acp.onSearchBoxFocus);
        doc.searchBox.on('keyup', acp.onSearchBoxEscape);
        doc.modelItemSelecter.on('click', '.ms-Dropdown-item', acp.onDropDownItemClick);
        doc.searchBoxClear.on('mousedown', acp.onSearchBoxClear);
    }


    /* Events */
    acp.onSearchBoxInput = function () {
        acp.curr++;

        var id = acp.curr;

        setTimeout(function () {
            if (id === acp.curr) {
                acp.fillDropDown();
                home.showModelItemsDropdown();
            }
        }, acp.timeout);
    }

    acp.onSearchBoxBlur = function () {
        acp.curr++;
    }

    acp.onSearchBoxFocus = function (e) {
        e.preventDefault();

        $(this).removeClass('input-error');
        home.showModelItemsDropdown(true);
        // acp.fillDropDown();
    }

    acp.onDropDownItemClick = function (e) {
        e.preventDefault();

        doc.searchBox.focus();

        var id = $(this).attr('data-id');

        if (id) {
            doc.searchBox.val($(this).text());
            acp.selectedItem = parseInt($(this).attr('data-id'));
            doc.searchBox.blur();

            setTimeout(function () {
                home.showModelItemsDropdown(false);
            }, 50);
        }
    }

    acp.onSearchBoxClear = function () {
        doc.searchBox.val('');
        doc.searchBox.focus();
        acp.fillDropDown();
        delete acp.selectedItem;
    }

    acp.onSearchBoxEscape = function (e) {
        if (e.keyCode === 27) {
            doc.searchBox.val('');
            acp.onSearchBoxInput();
        }
    }

    acp.reset = function () {
        doc.searchBox.val('');
        doc.modelItemSelecter.find('.ms-Dropdown-items').empty();

        delete acp.selectedItem;
    }


    /* --- Content --- */
    acp.fillDropDown = function () {
        odoo.getModelItemsAsync({
            model: doc.modelSelecter.find('.is-selected').attr('data-model'),
            search: doc.searchBox.val(),
            success: function (data) {
                home.fillSelectItems(data[0]);
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    RegExp.escape = function (s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
})();