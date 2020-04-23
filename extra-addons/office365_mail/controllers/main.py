# See LICENSE file for full copyright and licensing details.
import logging
import os

import werkzeug

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class OfficeAddInController(http.Controller):

    @http.route('/office365/add_in', type='http', auth='public', csrf=False)
    def get_manifest(self, **kwargs):
        absolute_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, 'office/manifest.xml'))
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')

        with open(absolute_file_path, 'r') as f:
            data = f.read()

        data = data.replace("{{URL}}", str(base_url))

        headers = [('Content-Type', 'application/xml;charset=utf-8'), ('Content-Length', len(data))]

        return request.make_response(data, headers=headers)

    @http.route('/redirect/<string:model_name>/<int:res_id>')
    def redirect_request(self, model_name, res_id, **kwargs):

        return werkzeug.utils.redirect('/web#id=%s&model=%s' % (res_id, model_name))
