# -*- coding: utf-8 -*-

from odoo import models, api, _
from datetime import datetime
from os.path import exists
from odoo.tools import ustr
import csv


class ResCompany(models.Model):
    _inherit = "res.company"

    @api.multi
    def write(self, vals):
        for company in self:
            if company.simus_code and vals.get('simus_code'):
                vals.pop('simus_code')
        return super(ResCompany, self).write(vals)

    @api.model
    def simus_send_email(self, subject, body, user_admin_id):
        mail_obj = self.env['mail.mail'].sudo(user_admin_id)
        mailing_list = self.env.ref('aaa_simus.simus_mailing_list').sudo().value
        mail_sender = self.env.ref('aaa_simus.simus_mail_sender_o365').sudo().value
        mail_server = self.env['ir.mail_server'].search([('smtp_user', '=', mail_sender)], limit=1)
        mail_server_id = mail_server.id
        self.env['mail.mail'].sudo(user_admin_id).create({'mail_server_id': mail_server_id,
                                                          'email_from': mail_sender,
                                                          'reply_to': mail_sender,
                                                          'email_to': mailing_list,
                                                          'subject': subject,
                                                          'body_html': body})

    @api.model
    def simus_create_company(self, simus_code, name, currency_id, parent_id, company_simus_codes,
                             company_id_simus_codes, admin_users, partner_obj):
        company = self.create({'simus_code': simus_code,
                               'name': name,
                               'currency_id': currency_id,
                               'parent_id': parent_id})
        company.partner_id.simus_code = simus_code
        company_id = company.id
        admin_users.write({'company_ids': [(4, company_id)]})
        company_id_simus_codes[company_id] = simus_code
        company_simus_codes[simus_code] = {'id': company_id, 'partner_simus_codes': {},
                                           'employee_simus_codes': {}, 'job_names': {},
                                           'partners_simus_code': partner_obj,
                                           'partners_no_simus_code': partner_obj}
        return company_id, name

    @api.model
    def simus_import_resources(self):
        path = self.env.ref('aaa_simus.simus_file_path_resources').sudo().value
        if exists(path):
            user_admin = self.env.ref('base.user_admin')
            user_admin_id = user_admin.id
            admin_users = self.env.ref('base.user_root') + user_admin
            user_obj = self.env['res.users']
            partner_obj = self.env['res.partner']
            employee_obj = self.env['hr.employee']
            job_obj = self.env['hr.job']
            hr_contract_obj = self.env['hr.contract']
            currency_id = self.env.ref('base.EUR').id
            parent_company_id = self.env.ref('base.main_company').id
            cr = self._cr
            company_simus_codes = {}
            company_id_simus_codes = {}
            for company in self.search_read([], ['simus_code']):
                company_id = company['id']
                company_simus_codes[company['simus_code']] = {'id': company_id, 'partner_simus_codes': {},
                                                              'employee_simus_codes': {}, 'job_names': {},
                                                              'partners_simus_code': partner_obj,
                                                              'partners_no_simus_code': partner_obj}
                company_id_simus_codes[company_id] = company['simus_code']
            lines = {}
            company_ids = []
            company_errors = new_companies = ""
            with open(path, 'r') as resources_file:
                resources_reader = csv.reader(resources_file, delimiter=',', quotechar='"')
                for line in resources_reader:
                    if line[1] == 'Identifiant cabinet':
                        next(resources_reader)
                    break
                for line in resources_reader:
                    if line:
                        simus_code = line[1]
                        if not line[2] in lines:
                            lines[line[2]] = []
                        lines[line[2]].append(line)
                        if simus_code:
                            try:
                                if simus_code not in company_simus_codes:
                                        company_id, name = self.simus_create_company(simus_code, line[0], currency_id, parent_company_id,
                                                                                     company_simus_codes, company_id_simus_codes,
                                                                                     admin_users, partner_obj)
                                        company_ids += [company_id]
                                        val = '<br></br><div>' + "id: " + ustr(company_id) + " name: " + ustr(name) + " simus_code: %s" % simus_code + '</div>'
                                        new_companies += val
                                else:
                                    company_id = company_simus_codes[simus_code]['id']
                                    if company_id not in company_ids:
                                        company_ids += [company_id]
                            except Exception as e:
                                val = '<br></br><div>' + "Company errors :" + ustr(line) + "</div><br></br><div>" + "error: " + ustr(e) + '</div>'
                                company_errors += val
                                continue
                        else:
                            company_errors += '<br></br><div>' + "No simus code: " + ustr(line) + '</div>'
            try:
                if new_companies:
                    cr.commit()
                    self.simus_send_email('Companies creation', new_companies, user_admin_id)
                if company_errors:
                    self.simus_send_email('Company Errors', company_errors, user_admin_id)
            except Exception as e:
                self.simus_send_email('Errors on companies creation', str(e), user_admin_id)
            lines_business_manager = lines.get('BM')
            lines_employee = lines.get('Salarié')
            lines_detachment = lines.get('Détachement')
            lines_subcontractor = lines.get('Externe')
            for job in job_obj.search_read([], ['name', 'company_id']):
                company_id = job['company_id'] and job['company_id'][0]
                if company_id in company_ids:
                    company_simus_codes[company_id_simus_codes[company_id]
                                        ]['job_names'][job['name']] = job['id']
            for partner in partner_obj.with_context(active_test=False).search_read([], ['simus_code', 'company_id']):
                company_id = partner['company_id'] and partner['company_id'][0]
                if company_id in company_ids:
                    company = company_simus_codes[company_id_simus_codes[company_id]]
                    if partner['simus_code']:
                        company['partner_simus_codes'][partner['simus_code']] = partner['id']
                        company['partners_simus_code'] |= partner_obj.with_context(active_test=False).browse(partner['id'])
                    else:
                        company['partners_no_simus_code'] |= partner_obj.with_context(active_test=False).browse(partner['id'])
            for employee in employee_obj.with_context(active_test=False).search_read([('simus_code', '!=', '')],
                                                                                     ['company_id', 'simus_code']):
                company_id = employee['company_id'] and employee['company_id'][0]
                if company_id:
                    employee_id = employee['id']
                    company = company_simus_codes[company_id_simus_codes[company_id]]
                    employee_simus_code = employee['simus_code']
                    if employee_simus_code:
                        company['employee_simus_codes'][employee_simus_code] = employee_id
            users_login = {}
            users_simus_code = {}
            for user in user_obj.with_context(active_test=False).search_read([], ['login', 'simus_code']):
                simus_code = user['simus_code']
                user_id = user['id']
                users_login[user['login']] = user_id
                if simus_code:
                    users_simus_code[simus_code] = user_id
            result, users_simus_code, users_login = user_obj.simus_business_manager(cr, lines_business_manager, company_simus_codes,
                                                                                    users_login, users_simus_code, employee_obj)
            if 'commit_error' not in result:
                values = ""
                for val in ['nb_lines', 'nb_users_created', 'nb_users_updated', 'nb_employees_created',
                            'nb_employees_updated', 'users_created', 'employees_created', 'users_error']:
                    values +=  '<div style="margin: 0px; padding: 0px;">' + val + ': ' + ustr(result[val]) + "</div>"
            else:
                values = "Users Commit Error" + ustr(result['commit_error'])
            self.simus_send_email('Import users', values, user_admin_id)
            result = employee_obj.simus_employee(cr, lines_employee, company_simus_codes, users_login,
                                                 job_obj, hr_contract_obj)
            if 'commit_error' not in result:
                values = ""
                for val in ['nb_lines', 'nb_employees_created', 'nb_employees_updated', 'nb_contracts_created',
                            'nb_contracts_updated', 'employees_created', 'contracts_created', 'employees_error']:
                    values += '<div style="margin: 0px; padding: 0px;">' + val + ': ' + ustr(result[val]) + "</div>"
            else:
                values = "Employees Commit Error" + ustr(result['commit_error'])
            self.simus_send_email('Import employees', values, user_admin_id)
            result = employee_obj.simus_employee(cr, lines_detachment, company_simus_codes, users_login,
                                                 job_obj, hr_contract_obj)
            if 'commit_error' not in result:
                values = ""
                for val in ['nb_lines', 'nb_employees_created', 'nb_employees_updated', 'nb_contracts_created',
                            'nb_contracts_updated', 'employees_created', 'contracts_created', 'employees_error']:
                    values += '<div style="margin: 0px; padding: 0px;">' + val + ': ' + ustr(result[val]) + "</div>"
            else:
                values = "Detachments Commit Error" + ustr(result['commit_error'])
            self.simus_send_email('Import detachments', values, user_admin_id)
            result = partner_obj.simus_create_subcontractor(cr, lines_subcontractor, company_simus_codes,
                                                            users_simus_code)
            if 'commit_error' not in result:
                values = ""
                for val in ['nb_lines', 'nb_partners_created', 'nb_partners_updated', 'partners_created', 'partners_error']:
                    values += '<div style="margin: 0px; padding: 0px;">' + val + ': ' + ustr(result[val]) + "</div>"
            else:
                values = "Externals Commit Error" + ustr(result['commit_error'])
            self.simus_send_email('Import externals', values, user_admin_id)

    @api.model
    def get_contact_name(self, partners, contact_name):
        contact_name = contact_name.lower()
        for contact in partners.filtered(lambda part: contact_name in part.name.lower()):
            return contact.id
        return False

    @api.model
    def simus_import_projects(self):
        path = self.env.ref('aaa_simus.simus_file_path_projects').value
        if exists(path):
            user_obj = self.env['res.users']
            partner_obj = self.env['res.partner']
            project_obj = self.env['project.project']
            task_obj = self.env['project.task']
            lines = []
            with open(path, 'r') as projects_file:
                projects_reader = csv.reader(projects_file, delimiter=',', quotechar='"')
                for line in projects_reader:
                    if line[1] == 'Identifiant cabinet':
                        next(projects_reader)
                    break
                date_end = self.env.ref('aaa_simus.simus_project_date_min').sudo().value
                for line in projects_reader:
                    date_end_project = line[5]
                    if line[0] and date_end_project and date_end_project >= date_end:
                        lines += [line]
            company_simus_codes = {}
            company_id_simus_codes = {}
            for company in self.search_read([], ['simus_code']):
                simus_code = company['simus_code']
                if simus_code:
                    company_id = company['id']
                    company_id_simus_codes[company_id] = simus_code
                    company_simus_codes[company['simus_code']] = {'id': company_id,
                                                                  'partner_simus_codes': {},
                                                                  'project_simus_code': {},
                                                                  'task_simus_code': {}}
            user_logins = {}
            company_user_bms = {}
            for user in user_obj.with_context(active_test=False).search_read([], ['login_simus', 'is_business_manager',
                                                                                  'company_ids', 'active']):
                user_id = user['id']
                user_logins[user['login_simus']] = user['id']
                is_business_manager = user['is_business_manager']
                if is_business_manager:
                    for company in user['company_ids']:
                        if company in company_user_bms:
                            company_user_bms[company] += [{'user_id': user_id, 'active': user['active']}]
                        else:
                            company_user_bms[company] = [{'user_id': user_id, 'active': user['active']}]
            for partner in partner_obj.with_context(active_test=False).search_read([('is_business_manager', '!=', True)],
                                                                                   ['simus_code', 'company_id']):
                company_id = partner['company_id'] and partner['company_id'][0]
                simus_code = partner['simus_code']
                if company_id and simus_code:
                    company_simus_codes[company_id_simus_codes[company_id]]['partner_simus_codes'][simus_code] = partner['id']
            for project in project_obj.with_context(active_test=False).search_read([], ['simus_code', 'company_id']):
                company_id = project['company_id'] and project['company_id'][0]
                simus_code = project['simus_code']
                if company_id and simus_code:
                    company_simus_codes[company_id_simus_codes[company_id]]['project_simus_code'][simus_code] = project['id']
            for task in task_obj.with_context(active_test=False).search_read([], ['simus_code', 'company_id']):
                company_id = task['company_id'] and task['company_id'][0]
                simus_code = task['simus_code']
                if company_id and simus_code:
                    company_simus_codes[company_id_simus_codes[company_id]]['task_simus_code'][simus_code] = task['id']
            date_now = datetime.now()
            result = {'nb_lines': len(lines), 'nb_projects_created': 0, 'nb_projects_updated': 0, 'nb_tasks_created': 0,
                      'nb_tasks_updated': 0, 'nb_partners_created': 0, 'nb_partners_updated': 0, 'projects_error': "",
                      'projects_created': "", 'tasks_created': "", 'partners_created': ""}
            for line in lines:
                company = company_simus_codes.get(line[1])
                if company:
                    try:
                        simus_code = line[9]
                        company_id = company['id']
                        name = line[8]
                        partner_data = {'simus_code': simus_code,
                                        'company_id': company_id,
                                        'lastname': name,
                                        'firstname': '',
                                        'customer': True,
                                        'is_company': True}
                        customer_id = company['partner_simus_codes'].get(simus_code)
                        if customer_id:
                            partner_obj.with_context(active_test=False).browse(customer_id).write(partner_data)
                            result['nb_partners_updated'] += 1
                        else:
                            customer = partner_obj.create(partner_data)
                            customer_id = customer.id
                            company['partner_simus_codes'][simus_code] = customer_id
                            val = '<br></br><div>' + "id: %s" % customer_id + " name: " + ustr(name) + " simus_code: %s company_id: %s" % (simus_code, company_id) + '</div>'
                            result['partners_created'] += val
                            result['nb_partners_created'] += 1
                        user_id = user_logins.get(line[15])
                        if not user_id:
                            result['projects_error'] += '<br></br><div>' + "Project error no bm found: %s " % line[15] + ustr(line) + '</div>'
                        project_code = line[2]
                        name = line[6]
                        project_data = {'simus_code': project_code,
                                        'partner_id': customer_id,
                                        'company_id': company_id,
                                        'user_id': user_id,
                                        'name': name,
                                        'description': line[7]}
                        project_id = company['project_simus_code'].get(project_code)
                        if project_id:
                            project_obj.with_context(active_test=False).browse(project_id).write(project_data)
                            result['nb_projects_updated'] += 1
                        else:
                            project = project_obj.create(project_data)
                            project_id = project.id
                            company['project_simus_code'][project_code] = project.id
                            val = '<br></br><div>' + "id: %s" % project_id + " name: " + ustr(name) + " simus_code: %s company_id: %s" % (project_code, company_id) + '</div>'
                            result['projects_created'] += val
                            result['nb_projects_created'] += 1
                        task_code = project_code + " - " + line[14]
                        active = True
                        date_deadline = line[19]
                        if date_deadline and datetime.strptime(date_deadline, '%Y-%m-%d') < date_now:
                            active = False
                        contact_id = customer_id
                        contact_client = line[27] or line[28] or False
                        if contact_client:
                            partners = partner_obj.with_context(active_test=False).browse(customer_id).child_ids
                            if partners:
                                res = self.get_contact_name(partners, contact_client)
                                if res:
                                    contact_id = res
                        name = line[6]
                        user_id = user_logins.get(line[15])
                        if not user_id:
                            result['projects_error'] += '<br></br><div>' + "Task error no consultant found: %s " % line[15] + ustr(line) + '</div>'
                        data_task = {'simus_code': task_code,
                                     'partner_id': contact_id,
                                     'company_id': company_id,
                                     'project_id': project_id,
                                     'user_id': user_id,
                                     'code_type': 'mission',
                                     'date_start': line[18],
                                     'date_deadline': date_deadline,
                                     'active': active,
                                     'name': name,
                                     'description': line[7]}
                        task_id = company['task_simus_code'].get(task_code)
                        if task_id:
                            task_obj.with_context(active_test=False).browse(task_id).write(data_task)
                            result['nb_tasks_updated'] += 1
                        else:
                            task = task_obj.create(data_task)
                            task_id = task.id
                            company['task_simus_code'][task_code] = task_id
                            val = '<br></br><div>' + "id: %s" % task_id + " name: " + ustr(name) + " simus_code: %s company_id: %s" % (task_code, company_id) + '</div>'
                            result['tasks_created'] += val
                            result['nb_tasks_created'] += 1
                    except Exception as e:
                        val = '<br></br><div>' + "Projects tasks error: " + ustr(line) + "</div><br></br><div>" + "error: " + ustr(e) + '</div>'
                        result['projects_error'] += val
                        continue
                else:
                    result['projects_error'] += '<br></br><div>' + "Projects tasks error no company found: " + ustr(line) + '</div>'
            try:
                if lines:
                    self._cr.commit()
            except Exception as e:
                result['commit_error'] = e
            if 'commit_error' not in result:
                values = ""
                for val in ['nb_lines', 'nb_partners_created', 'nb_partners_updated', 'nb_projects_created', 'nb_projects_updated',
                            'nb_tasks_created', 'nb_tasks_updated', 'partners_created', 'projects_created', 'tasks_created',
                            'projects_error']:
                    values += '<div style="margin: 0px; padding: 0px;">' + val + ': ' + ustr(result[val]) + "</div>"
            else:
                values = "Projects Commit Error" + ustr(result['commit_error'])
            self.simus_send_email('Import projects', values, self.env.ref('base.user_admin').id)
