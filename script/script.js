window.onscroll = function() {myFunction()};

var navbar = document.getElementById("navbar");
var sticky = navbar.offsetTop;

function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky")
  } else {
    navbar.classList.remove("sticky");
  }
}

$(window).scroll(function() {
  var scrollPos = $(this).scrollTop();
  $(".background_picture").css({
    "background-size" : scrollPos + 100 + "%"
  });
});
