Template.intro.events = {
  'click #waartaa-try-btn': function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#login-dropdown-list .dropdown-toggle').click();
  }
};