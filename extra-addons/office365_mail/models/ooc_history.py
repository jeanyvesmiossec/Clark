# See LICENSE file for full copyright and licensing details.

from odoo import models, fields


class OocHistory(models.Model):
    _name = 'ooc.history'
    _description = "Outlook Connector History"

    mail = fields.Many2one('mail.message', string='Mail', required=True, ondelete='cascade')
    model = fields.Char(related='mail.model', string='Model', store=True, readonly=False)
    res_id = fields.Integer(related='mail.res_id', string='Model Id', readonly=False)
    user = fields.Char(related='mail.author_id.name', string='User', store=True, readonly=False)
