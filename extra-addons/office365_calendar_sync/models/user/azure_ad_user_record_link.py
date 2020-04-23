# -*- coding: utf-8 -*-
####################################################################
#
# © 2019-Today Somko Consulting (<https://www.somko.be>)
#
# License OPL-1 or later (https://www.odoo.com/documentation/user/11.0/legal/licenses/licenses.html)
#
####################################################################
from odoo import api, models


class AzureAdUserRecordLink(models.Model):
    _inherit = 'azure.ad.user.record.link'

    def write(self, vals):
        # Check if ical_uid update is necessary
        if 'ical_uid' in vals and self.record.from_outlook:
            self.record.with_context(is_o_value_update=True).write({'outlook_ical_uid': vals['ical_uid']})

        # Remove ical_uid if it exists
        vals.pop('ical_uid', None)

        return super(AzureAdUserRecordLink, self).write(vals)
