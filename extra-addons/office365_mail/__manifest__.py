# -*- coding: utf-8 -*-
# Odoo Proprietary License v1.0
#
# This software and associated files (the "Software") may only be used (executed, modified,
# executed after modifications) if you have purchased a valid license from the authors, typically
# via Odoo Apps, or if you have received a written agreement from the authors of the Software (see
# the COPYRIGHT file).
#
# You may develop Odoo modules that use the Software as a library (typically by depending on it,
# importing it and using its resources), but without copying any source code or material from the
# Software. You may distribute those modules under the license of your choice, provided that this
# license is compatible with the terms of the Odoo Proprietary License (For example: LGPL, MIT, or
# proprietary licenses similar to this one).
#
# It is forbidden to publish, distribute, sublicense, or sell copies of the Software or modified
# copies of the Software.
#
# The above copyright notice and this permission notice must be included in all copies or
# substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
{
    'name': 'Office 365 Add In',
    'version': '12.0.2.0',
    'author': 'Somko',
    'category': 'Productivity',
    'description': """Handles the connection to Microsoft Exchange Servers for adding the attachments of an email to an internal message inside Odoo and creating new object in Odoo.""",
    'summary': """Create Odoo objects from Outlook""",
    'website': 'https://www.somko.be',
    'images': ['static/description/cover.png',],
    'license': "OPL-1",
    'depends': ['base', 'mail'],
    'data': [
        'security/ooc_security.xml',
        'security/ir.model.access.csv',

        'views/ooc_message_model.xml',
        'views/ooc_creation_model.xml',
        'views/ooc_history.xml',
        'views/menu.xml',
    ],
    "price": 499,
    "currency": "EUR",
}
