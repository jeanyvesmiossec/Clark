# -*- coding: utf-8 -*-
####################################################################
#
# © 2019-Today Somko Consulting (<https://www.somko.be>)
#
# License OPL-1 or later (https://www.odoo.com/documentation/user/11.0/legal/licenses/licenses.html)
#
####################################################################
from datetime import timedelta, datetime

from odoo import models, api, fields, _
from odoo.exceptions import ValidationError

EVENTS_CREATE_DOMAIN = 'calendars/%s/events'
EVENTS_WEBHOOK_CHANGE_TYPE = 'Deleted,Updated,Created'
AZURE_AD_SCOPE_EXPANSION = 'https://outlook.office.com/calendars.readwrite'


class AzureAdUser(models.Model):
    _inherit = 'azure.ad.user'

    calendar_id = fields.Many2one(string='ID of the synced calendar(s)', comodel_name='azure.ad.calendar', ondelete='set null')
    calendar_option_ids = fields.One2many(string='AzureAD Calendar Options', comodel_name='azure.ad.calendar', inverse_name='azure_ad_user_id')
    calendar_ignore_without_category = fields.Boolean(string='Only Sync Calendar Items With Category', default=True)
    calendar_sync_failed = fields.Boolean(string='Calendar sync has failed', default=False)

    def reload_calendar_options(self):
        for rec in self:
            # Unlink previous options
            rec.calendar_option_ids.unlink()

            # Create new options
            rec.create_calendar_options()

    # -------------
    # Azure Objects
    # -------------
    def create_calendar_options(self):
        calendars = self.env['azure.ad.calendar'].get_all_calendars(self)

        for cal in calendars:
            self.env['azure.ad.calendar'].create({
                'azure_ad_user_id': self.id,
                'uid': cal['uid'],
                'name': cal['name'],
            })

    # ---------
    # Overrides
    # ---------
    @api.model
    def get_azure_ad_scope(self):
        return super(AzureAdUser, self).get_azure_ad_scope() + ' ' + AZURE_AD_SCOPE_EXPANSION

    @api.model
    def get_updated_link_data(self, method, data):
        r = super(AzureAdUser, self).get_updated_link_data(method, data)

        if method in ['POST'] and 'iCalUId' in data:
            r.update({'ical_uid': data['iCalUId']})

        return r

    def init_webhook(self):
        self.ensure_one()
        super(AzureAdUser, self).init_webhook()
            # WEBHOOK Re-enable after json/http logic in controller has been implemented

            # self.azure_ad_subscription_ids.create({
            #     'user_id': self.id,
            #     'resource': CONTACTS_CREATE_DOMAIN,
            #     'change_type': CONTACTS_WEBHOOK_CHANGE_TYPE
            # })

    def init_sync(self):
        self.ensure_one()

        r = super(AzureAdUser, self).init_sync()
        self.start_calendar_sync()
        return r

    def start_calendar_sync(self):
        for rec in self:
            rec.remove_unused_calendar_options()

            # # Reactivate previous record links
            # azure_events, ignore = rec.calendar_id.get_events_from_azure(None)
            # event_azure_ids = [event['Id'] for event in azure_events]
            #
            # self.env['azure.ad.user.record.link'].with_context(active_test=False).search([
            #     ('data_id', 'in', event_azure_ids),
            # ]).filtered(lambda x: x.record.exists()).write({'active': True, 'user_id': rec.id})

            # Odoo -> Outlook
            # Get all meetings for this user in Odoo between last month and ten years from now.
            min_date = fields.Datetime.to_string(datetime.now() - timedelta(days=30))
            max_date = fields.Datetime.to_string(datetime.now() + timedelta(days=3650))

            meetings_domain = [('start', '>=', min_date), ('start', '<=', max_date), ('partner_ids', 'in', rec.partner_id.id)]
            meetings = rec.env['calendar.event'].search(meetings_domain)

            meetings.create_link(rec.partner_id)

            rec.calendar_sync_failed = False

    def validate_fields(self):
        for rec in self:
            # Checks if calendar exists
            if not rec.calendar_id:
                raise ValidationError('%s\n\n%s' % (_('No Outlook Calendar selected'), _('You have not chosen a calendar yet. Please pick a calendar before starting the synchronisation.')))

            # Ensures correct credentials
            super(AzureAdUser, rec).validate_fields()

            # Tests if an outlook category has been defined
            if not rec.calendar_id.exists_in_azure():
                raise ValidationError('%s\n\n%s' % (_('Outlook Calendar does not exists'), _('The chosen calendar does not exists (anymore). Please pick another calendar before starting the synchronisation.')))

    def remove_unused_calendar_options(self):
        ids = self.calendar_option_ids.ids

        try:
            ids.remove(self.calendar_id.id)
        except ValueError:
            pass

        self.env['azure.ad.calendar'].browse(ids).unlink()
