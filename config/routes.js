/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {


  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝
  'GET /': {action: 'entrance/view-login', locals: {layout: 'layouts/layout-login.ejs'}},
  'GET /welcome': {action: 'dashboard/view-welcome'},

  'GET /faq': {view: 'pages/faq'},
  'GET /legal/terms': {view: 'pages/legal/terms'},
  'GET /legal/privacy': {view: 'pages/legal/privacy'},
  'GET /contact': {view: 'pages/contact'},

  'GET /signup': {action: 'entrance/view-signup', locals: {layout: 'layouts/layout-login.ejs'}},
  'GET /email/confirm': {action: 'entrance/confirm-email'},
  'GET /email/confirmed': {view: 'pages/entrance/confirmed-email'},

  'GET /login': {action: 'entrance/view-login', locals: {layout: 'layouts/layout-login.ejs'}},
  'GET /password/forgot': {action: 'entrance/view-forgot-password'},
  'GET /password/new': {action: 'entrance/view-new-password'},

  'GET /account': {action: 'account/view-account-overview'},
  'GET /account/password': {action: 'account/view-edit-password'},
  'GET /account/profile': {action: 'account/view-edit-profile'},


  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝
  // Note that, in this app, these API endpoints may be accessed using the `Cloud.*()` methods
  // from the CloudSDK library.
  '/api/v1/account/logout': {action: 'account/logout'},
  'PUT   /api/v1/account/update-password': {action: 'account/update-password'},
  'PUT   /api/v1/account/update-profile': {action: 'account/update-profile'},
  'PUT   /api/v1/account/update-billing-card': {action: 'account/update-billing-card'},
  'PUT   /api/v1/entrance/login': {action: 'entrance/login'},
  'POST  /api/v1/entrance/signup': {action: 'entrance/signup'},
  'POST  /api/v1/entrance/send-password-recovery-email': {action: 'entrance/send-password-recovery-email'},
  'POST  /api/v1/entrance/update-password-and-login': {action: 'entrance/update-password-and-login'},
  'POST  /api/v1/deliver-contact-form-message': {action: 'deliver-contact-form-message'},


  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝


  //  ╔╦╗╦╔═╗╔═╗  ╦═╗╔═╗╔╦╗╦╦═╗╔═╗╔═╗╔╦╗╔═╗
  //  ║║║║╚═╗║    ╠╦╝║╣  ║║║╠╦╝║╣ ║   ║ ╚═╗
  //  ╩ ╩╩╚═╝╚═╝  ╩╚═╚═╝═╩╝╩╩╚═╚═╝╚═╝ ╩ ╚═╝
  '/terms': '/legal/terms',
  '/logout': '/api/v1/account/logout',


  // WEB PAGE ADMIN
  // sửa lại url tất cả đều phải đứng sau /admin

  'GET /admin': {
    view: 'admin/ghtkAll',
    action: 'Tracking/getAllTrackings',
    locals: {layout: 'layouts/layout-admin-lte'}
  },
  'GET /admin/tracking': 'Tracking.getAllTrackings',
  'GET /admin/delay': {action: 'Tracking/getAllDelays', locals: {layout: 'layouts/layout-admin'}},
  'POST /admin/unhandle': {action: 'Tracking/getUnhandle'},


  // API ADMIN
  // sửa lại url theo dạng : /api/admin/v1/ + action

  'POST /api/tracking': 'Tracking.index',
  'POST /webhook/ghtk': 'Tracking.gHTKWebHooks',
  'POST /handling': 'Tracking.handling',
  'POST /api/admin/v1/image': {action: 'Tracking/upImage'},

  // 'POST /admin/unhandle':              'Tracking.getUnhandle'
};
