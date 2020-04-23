var translations = {};

translations.dict = {
    /* General */
    "Back": {
        nl: 'Terug',
        fr: ''
    },
    "Cancel": {
        nl: 'Terug',
        fr: ''
    },
    "Model": {
        nl: 'Model',
        fr: ''
    },
    "Item": {
        nl: 'Item',
        fr: ''
    },
    "Yes": {
        nl: 'Ja',
        fr: ''
    },
    "No": {
        nl: 'Nee',
        fr: ''
    },

    /* Connection */
    "Error - Could not make a connection. Please check your {}settings{}.": {
        nl: 'Error - Kan geen connectie maken. Gelieve uw {}instellingen{} te controlleren.',
        fr: ''
    },

    /* General Actions */
    "Actions": {
        nl: 'Acties',
        fr: ''
    },
    "Items": {
        nl: 'Items',
        fr: ''
    },
    "Models": {
        nl: 'Modellen',
        fr: ''
    },
    "Subject": {
        nl: 'Onderwerp',
        fr: ''
    },
    "Body": {
        nl: 'Body',
        fr: ''
    },
    "Attachments": {
        nl: 'Bijlages',
        fr: ''
    },
    "No attachments found.": {
        nl: 'Geen bijlages gevonden',
        fr: ''
    },

    /* Action Buttons */
    "Attach to an existing object": {
        nl: 'Koppel aan een bestaand object',
        fr: ''
    },
    "Attaches this email to an object in Odoo": {
        nl: 'Koppelt deze email aan een object in Odoo',
        fr: ''
    },
    "Show attached": {
        nl: 'Toon gekoppelde items',
        fr: ''
    },
    "Show the items this email is attached to": {
        nl: 'Toon de items waar deze email aan toegevoegd is',
        fr: ''
    },
    "Create": {
        nl: 'Creëer',
        fr: ''
    },

    /* Attached List */
    "Info": {
        nl: 'Info',
        fr: ''
    },
    "This item is being displayed as a message for the following item(s):": {
        nl: 'Dit item wordt weergegeven als een bericht voor de volgende items:',
        fr: ''
    },
    "Open": {
        nl: 'Open',
        fr: ''
    },
    "No items attached.": {
        nl: 'Nog geen items gekoppeld',
        fr: ''
    },
    "Attach this message to another odoo item {}here{}.": {
        nl: 'Koppel dit bericht aan een item in Odoo {}hier{}.',
        fr: ''
    },

    /* Attach */
    "Attach": {
        nl: 'Koppel',
        fr: ''
    },
    "Attach this email to an item in Odoo": {
        nl: 'Koppel deze email aan een item in Odoo',
        fr: ''
    },
    "Choose a model…": {
        nl: 'Kies een model...',
        fr: ''
    },
    "Search": {
        nl: 'Zoek',
        fr: ''
    },
    "Choose a model first...": {
        nl: 'Kies een model...',
        fr: ''
    },
    "No items for this model found...": {
        nl: 'Geen items voor dit model gevonden...',
        fr: ''
    },
    "Attaching message...": {
        nl: 'Bericht aan het toevoegen...',
        fr: ''
    },
    "Success - Message attached!": {
        nl: 'Succes - Bericht gekoppeld',
        fr: ''
    },
    "Error - Failed attaching message. Please try again or contact an administrator.": {
        nl: 'Error - Bericht koppelen mislukt. Gelieve opnieuw te proberen of een beheerder te contacteren.',
        fr: ''
    },

    /* Creation */
    "Create a new {}{} in Odoo.": {
        nl: 'Creëer een nieuwe {}{} in Odoo.',
        fr: ''
    },
    "This email also gets added as the first message to the created item.": {
        nl: 'Deze email wordt ook toegevoegd als het het eerste bericht bij dit nieuwe item.',
        fr: ''
    },
    "Creating {}{}...": {
        nl: 'Creatie van {}{} bezig...',
        fr: ''
    },
    "Success - {}{} created!": {
        nl: 'Succes - {}{} gecreëerd!',
        fr: ''
    },
    "Error - Failed creating {}{}. Please try again or contact an administrator.": {
        nl: 'Error - Creëeren van {}{} mislukt. Gelieve opnieuw te proberen of een beheerder te contacteren.',
        fr: ''
    },
   
    /* Settings */
    "Settings": {
        nl: 'Instellingen',
        fr: ''
    },
    "Odoo instance URL": {
        nl: 'Odoo URL',
        fr: ''
    },
    "Odoo username": {
        nl: 'Odoo Gebruikersnaam',
        fr: ''
    },
    "Odoo password": {
        nl: 'Odoo Paswoord',
        fr: ''
    },
    "Success - Connection successful.": {
        nl: 'Success - Connectie gelukt.',
        fr: ''
    },
    "Error - Could not make a connection. Please recheck your information.": {
        nl: 'Error - Kan geen connectie maken. Gelieve je gegevens te controleren.',
        fr: ''
    },
    "Checking connection...": {
        nl: 'Connectie controlleren...',
        fr: ''
    },
    "Save": {
        nl: 'Opslaan',
        fr: ''
    },
    "Save changes": {
        nl: 'Aanpassingen opslaan',
        fr: ''
    },
    "Are you sure you want to save these changes?": {
        nl: 'Ben je zeker dat je deze aanpassingen wil opslaan?',
        fr: ''
    },
    "Changes saved!": {
        nl: 'Aanpassingen bewaard!',
        fr: ''
    },
    "Please reopen the Add-In.": {
        nl: 'Gelieve de Add-In opnieuw te openen.',
        fr: ''
    },
   
    "enTranslation": {
        nl: 'nlTranslation',
        fr: ''
    }
};


translations.language = 'en';
translations.available = ['en', 'nl', 'fr'];

translations.init = function (language) {
    if (translations.available.indexOf(language) > -1) {
        translations.language = language;
    }

    translations.translateTags();
}

translations.translateTags = function () {
    $('[data-translate]').each(function () {
        var elem = $(this);

        if (elem.context.children.length > 0) {
            var oText = '';
            elem.contents().each(function () {
                if (oText !== '') oText += '{}';
                oText += $(this).text();
            });

            var vText = translations.translate(oText.replace(/^\s+|\s+$/g, '')).split('{}');
            
            elem.contents().each(function (key) {
                if (this.nodeType === 3) {
                    this.data = vText[key];
                } else {
                    $(this).text(vText[key]);
                }
            });
        } else {
            elem.text(translations.translate(elem.text().replace(/^\s+|\s+$/g, '')));
        }
    });
}

translations.translate = function (text) {
    if (text in translations.dict) {
        var translation = translations.dict[text][translations.language];

        if (translation != undefined) {
            return translation;
        }
    }
    else {
        console.log('No translation for ' + text);
    }
    
    return text;
}