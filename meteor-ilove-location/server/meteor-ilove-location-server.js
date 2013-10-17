instaStream = new Meteor.Stream('insta');
locations = new Meteor.Collection('locations');

if (Meteor.isServer) {
  var instagram = Meteor.require('instagram').createClient('<client_id>', '<client_secret>');
  var request = Meteor.require('request');
  var locBuffer = [];

  instaStream.permissions.write(function() {
    return false;
  });

  instaStream.permissions.read(function() {
    return true;
  });

  Meteor.methods({
    register: function(location) {
      var loc = locations.find({location: location});
      if (loc.count() < 1) {
        console.log("Adding new Location " + location);
        //http://api.geonames.org/postalCodeLookupJSON?placename=San%20Jose&maxRows=1&username=hharnisch
        request('http://api.geonames.org/postalCodeLookupJSON?placename=' + encodeURI(location) + '&username=hharnisch', 
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              if (!!body) {
                var postalcodes = JSON.parse(body).postalcodes;
                if (postalcodes.length > 0){
                  var now = (new Date()).getTime();
                  locBuffer.push({location: location, postalcodes: postalcodes, last_seen: now});
                }
              }
              //TODO: send error message if bad info
            }
          }
        );
      } else {
        console.log('re-register');
        var now = (new Date()).getTime();
        locations.update(loc.id, {
          location: loc.location,
          postalcodes: loc.postalcodes,
          last_seen: now
        });
      }
    }
  });

  Meteor.setInterval(function () {
    // if the buffer has some data add it to the database
    while (locBuffer.length > 0) {
      locations.insert(locBuffer.pop());
    }
  }, 500);

  Meteor.setInterval(function () {
    locations.find({}).forEach(function(loc) {
      console.log("Location " + loc.location + ' ' + loc.last_seen);
      // grab random zipcode in the area
      var postalcode = _.shuffle(loc.postalcodes)[0];
      instagram.media.search({'lat': postalcode.lat, 'lng': postalcode.lng}, function (images, error) {
        _.each(_.first(_.shuffle(images), 4), function(media) {
          var caption = '';
          if (media.caption) {
            caption = media.caption.text
          }
          instaStream.emit(loc.location, {caption: caption, 
            image: media.images.standard_resolution.url,
            likes: media.likes.count,
            user: media.user.username
          });
        });
      });
    });
  }, 3000);

  // remove any location that hasn't been updated in 20 seconds
  Meteor.setInterval(function () {
    console.log('remove stuff');
    var now = (new Date()).getTime();
    locations.remove({last_seen: {$lt: (now - 20 * 1000)}});
  }, 5000);
}