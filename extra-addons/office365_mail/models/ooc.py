# See LICENSE file for full copyright and licensing details.

from odoo import models, api
from xml.etree.cElementTree import fromstring
import requests


class OocOoc(models.Model):
    _name = 'ooc.ooc'

    @api.model
    def is_installed(self):
        return True

    @api.model
    def create_mail(self, params):
        if len(params['attachments']) > 0:
            params['attachment_ids'] = [(6, 0, self.create_attachments(params))]

        del params['attachments']
        del params['ewsUrl']
        del params['token']

        record = self.env['mail.message'].create(params)
        self.env['ooc.history'].sudo().create({'mail': record['id']})

        return record['id']

    @api.model
    def create_attachments(self, params):
        url = params['ewsUrl']
        headers = {'content-type': 'text/xml; charset=utf-8', 'Authorization': 'Bearer {0}'.format(params['token'])}
        body = """<?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                    xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">
                    <soap:Header>
                        <t:RequestServerVersion Version="Exchange2013" />
                    </soap:Header>
                    <soap:Body>
                        <GetAttachment xmlns="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">
                            <AttachmentShape/>
                            <AttachmentIds>
                                <t:AttachmentId Id="{0}"/>
                            </AttachmentIds>
                        </GetAttachment>
                    </soap:Body>
                </soap:Envelope>"""

        attachments = []

        for att in params['attachments']:
            content = self.soap_get_attachment_content(url, headers, body, att['id'])
            curr = Attachment(att['name'], content, params['model'], params['res_id'])
            record = self.env['ir.attachment'].sudo().create(vars(curr))
            attachments.append(record['id'])

        return attachments

    @api.model
    def soap_get_attachment_content(self, url, headers, body, sid):
        response = requests.post(url, data=body.format(sid), headers=headers, verify=False)
        xml = fromstring(response.content)
        content = xml.find('.//t:Content', {'t': 'http://schemas.microsoft.com/exchange/services/2006/types'})

        return content.text


class Attachment(object):
    def __init__(self, name, content, res_model, res_id):
        self.name = name
        self.res_id = res_id
        self.res_model = res_model
        self.datas_fname = name
        self.datas = content
        self.type = 'binary'
