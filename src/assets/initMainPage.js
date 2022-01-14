const AppAdminLTE = {
  initMainPage: function () {
    window.jQuery('body').Layout();
    window.jQuery('[data-toggle="push-menu"]').PushMenu();
// $('[data-widget="treeview"]').Treeview('init');
    window.jQuery('[data-widget="treeview"]').Treeview();
  }
};
