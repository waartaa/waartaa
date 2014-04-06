Template.header.rendered = function () {
    // Disable the navbar collapse button when there are no
    // li items present in the navbar

    nav_items_children = $('#nav-collapse-1').children();

    // Grandchildren represent the li items, checking for total number
    // of li items present in the navbar
    var first_grandchildren_count = 0, second_grandchildren_count = 0;
    if (nav_items_children.length == 1) {
        first_child = nav_items_children[0];
        first_grandchildren_count = first_child.childElementCount;
    }

    if (nav_items_children.length == 2) {
        second_child = nav_items_children[1];
        second_grandchildren_count = second_child.childElementCount;
    }

    if (first_grandchildren_count + second_grandchildren_count === 0)
        $('.navbar-toggle').hide();
    else
        $('.navbar-toggle').show();
};
