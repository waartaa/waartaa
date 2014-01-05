Template.chat.rendered = function () {
  $('.content-main').addClass('no-padding');
}

Deps.autorun(waartaa.chat.helpers.highlightServerRoom);