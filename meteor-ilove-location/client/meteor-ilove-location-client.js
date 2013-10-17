instaStream = new Meteor.Stream('insta');
locations = new Meteor.Collection('locations');
var images = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];

if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.call('register', 'San Francisco, CA', function(data) {});
    $(window).resize(_.debounce(updateImageSizes, 300));
    updateCity('San Francisco, CA');
    setTimeout(function(){
      $('.infobox').animate({opacity: 0}, function() {
        $('.infobox').hide();
      });
    }, 5000);
  });

  // update the city stream
  function updateCity(city) {
    resetColors();
    var map = [9, 11, 5, 6, 7, 8,  14, 2, 10, 13, 0, 3, 4, 12, 1];
    var curItem = 0;
    Session.set('city', city);
    // configure new stream
    instaStream.on(city, function(update) {
      var newImageLoc = images[map[curItem]];
      $('#' + newImageLoc).animate( {opacity: 0}, 300, function(){
        $('#' + newImageLoc).html(Template.image({
          url: update.image, 
          user: update.user,
          likes: update.likes
        }));
        $('#' + newImageLoc + ' > a > img').load(function(){
          $('#' + newImageLoc).animate({opacity: 1}, 300);
        });
     });
      curItem += 1;
      if (curItem > map.length) {
        curItem = 0;
      }
    });
  };

  // set all the boxes backgrounds
  function resetColors() {
    $('img').attr('src', '');
    $('.likes').empty();
    var colors = ["#5797CB", "#AF9550", "#A1D0D5", "#ACB060", "#93ABD3", "#4872B4",
                  "#A1A5A8", "#E1E3E5", "#24262C", "#E65E62"];
    var curColor = 0;
    _.each(images, function(image) {
      $('#' + image).css({'background': colors[curColor]});
      curColor += 1;
      if (curColor >= colors.length) {
        curColor = 0;
      }
    });
    updateImageSizes();
  };

  // make sure the stream for the current city stays alive
  Meteor.setInterval(function () {
      Meteor.call('register', Session.get('city'), function(data) {

      });
  }, 5000);

  // update the images based on the view size
  function updateImageSizes() {
    var windowWidth = $(window).width() * 0.75;
    var windowHeight = $(window).height() * 0.75;

    // width is limiting
    if ((windowWidth / windowHeight) < (5/4)) {
      $('.display').width(windowWidth).height(windowWidth * (4/5));
    // height is limiting
    } else if ((windowWidth / windowHeight) > (5/4)) {
      $('.display').width(windowHeight* (5/4)).height(windowHeight);
    } else {
      $('.display').width(windowWidth).height(windowHeight);
    }
  };

   Template.cityInput.events({
     'keyup': function(e,t){
        if (e.keyIdentifier === 'Enter') {
          var newCity = $('.city').val();
          if (!!newCity) {
            updateCity(newCity);
          }
        }
      }
    });

    // hook up follow button js
  Template.twitter.rendered = function () {
    ! function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (!d.getElementById(id)) {
        js = d.createElement(s);
        js.id = id;
        js.src = "//platform.twitter.com/widgets.js";
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, "script", "twitter-wjs");
  };
}