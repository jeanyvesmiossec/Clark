# -*- coding: utf-8 -*-
####################################################################
#
# © 2019-Today Somko Consulting (<https://www.somko.be>)
#
# License OPL-1 or later (https://www.odoo.com/documentation/user/11.0/legal/licenses/licenses.html)
#
####################################################################
import traceback

from odoo import http
from odoo.http import request


class OocCalendarController(http.Controller):

    @http.route('/office365_calendar_sync/sync', type='json', auth='user')
    def sync_data(self, **kw):
        user = request.env['res.users'].browse(request.uid)

        if not user.company_id.aad_oauth_enabled:
            return {'status': "not_allowed"}

        if not user.azure_ad_user_id:
            return {'status': "no_user"}

        if not user.azure_ad_sync_started:
            return {'status': "sync_not_started"}

        if user.azure_ad_authentication_failure:
            return {"status": "auth_failure"}

        if not user.azure_ad_user_id.sudo().calendar_id or user.azure_ad_user_id.sudo().calendar_sync_failed:
            return {'status': "no_calendar"}

        try:
            result = user.sync_azure()
        except Exception:
            if user.azure_ad_authentication_failure:
                return {"status": "auth_failure"}

            if not user.azure_ad_user_id.sudo().calendar_id or user.azure_ad_user_id.sudo().calendar_sync_failed:
                return {'status': "no_calendar"}

            traceback.print_exc()
            return {"status": "failed"}

        return {"status": "success", "update_count": result}
