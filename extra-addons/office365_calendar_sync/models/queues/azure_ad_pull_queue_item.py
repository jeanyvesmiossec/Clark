# -*- coding: utf-8 -*-
####################################################################
#
# © 2019-Today Somko Consulting (<https://www.somko.be>)
#
# License OPL-1 or later (https://www.odoo.com/documentation/user/11.0/legal/licenses/licenses.html)
#
####################################################################
import logging
import traceback

from odoo import api, models

_logger = logging.getLogger(__name__)


class AzureAdPullQueueItem(models.Model):
    _inherit = 'azure.ad.pull.queue.item'

    # ---------
    # Overrides
    # ---------
    def process(self, updated=0):
        if self.domain == 'calendar' or not self.domain:
            try:
                updated += self.user_id.calendar_id.sync()
            except Exception:
                # Exception normally catched higher

                traceback.print_exc()

        return super(AzureAdPullQueueItem, self).process(updated)
