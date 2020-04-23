# See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api


class OocCreationModel(models.Model):
    _name = 'ooc.creation.model'
    _description = "Odoo Outlook Connector Creation Model"

    name = fields.Char(string="Name", required=True, translate=True, help="This is the name of the model that the user will see in Outlook")
    model_id = fields.Many2one('ir.model', string='Model', required=True)
    model_name = fields.Char(related='model_id.model', store=True, readonly=False)

    subject_field_title = fields.Char(string="Subject Field Title", translate=True, help="This is the label of the subject field that the user will see in Outlook")
    subject_field_id = fields.Many2one('ir.model.fields', string='Subject field', required=True)
    subject_field_name = fields.Char(related='subject_field_id.name', store=True, readonly=False)

    message_field_title = fields.Char(string="Message Field Title", translate=True, help="This is the label of the message body field that the user will see in Outlook")
    message_field_id = fields.Many2one('ir.model.fields', string='Message field', required=True)
    message_field_name = fields.Char(related='message_field_id.name', store=True, readonly=False)
    message_field_type = fields.Selection(related='message_field_id.ttype', readonly=False)

    from_email_field_id = fields.Many2one('ir.model.fields', string='From Email field')
    from_email_field_name = fields.Char(related='from_email_field_id.name', store=True, readonly=False)

    from_name_field_id = fields.Many2one('ir.model.fields', string='From Name field')
    from_name_field_name = fields.Char(related='from_name_field_id.name', store=True, readonly=False)

    user_field_id = fields.Many2one('ir.model.fields', string='User')
    user_field_name = fields.Char(related='user_field_id.name', store=True, readonly=False)

    @api.model
    def get_allowed_models(self):
        sr_models = self.search_read()
        allowed_models = []

        for sr_m in sr_models:
            try:
                self.env[sr_m['model_name']].check_access_rights('create')

                allowed_models.append(sr_m)
            except:
                pass

        return allowed_models
