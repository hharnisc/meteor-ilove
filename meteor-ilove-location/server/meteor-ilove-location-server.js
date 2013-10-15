instaStream = new Meteor.Stream('insta');

if (Meteor.isServer) {
  var instagram = Meteor.require('instagram').createClient('4fd7ebff4df246539cdb6aaa471499db', 'c5cb143ccacc42e0ac8e2fc9bf394ddb');
  Meteor.setInterval(function () {
    instagram.media.popular(function (images, error) {
      _.each(_.first(images, 4), function(media) {
        var caption = '';
        if (media.caption) {
          caption = media.caption.text
        }
        instaStream.emit('update', {caption: caption, 
          image: media.images.standard_resolution.url,
          likes: media.likes.count,
          user: media.user.username
        });
      });
    });
  }, 3000);

}