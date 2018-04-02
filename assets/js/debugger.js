$(document).ready(function () {
  $('.graph-get').click(function () {
    var tag = $(this);
    var url = tag.attr('data-url');
    $.getJSON('https://graph.facebook.com/?id=' + url, function (data) {
      var cmmnt = data.share.comment_count;
      var share = data.share.share_count;
      var content = 'c:' + cmmnt + ', s:' + share;
      tag.text(content);
    });
  });
});
