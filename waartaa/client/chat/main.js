Template.chat.created = function () {
  Meteor.setTimeout(function () {
    $('.content-main').addClass('no-padding');
    updateHeight();
  }, 0);
}

Deps.autorun(waartaa.chat.helpers.highlightServerRoom);

