var express = require('express')
  , request = require('request')
  , util = require('util')
  , zapierUrl = process.env.ZAPIER_WEBHOOK
  , port = process.env.PORT || 3000
  , app = express();

if(!zapierUrl) {
  throw Error('Missing Zapier Webhook URL. Please set `ZAPIER_WEBHOOK` Env Variable.');
}

app.post('/*', function (req, res) {
  var ua = req.get('User-Agent')
    , signature = req.get('Content-MD5')
    , ip = ip = req.get('x-forwarded-for') || req.connection.remoteAddress
    , urlPath = req.params[0]
    , zapierUrl = 'https://hooks.zapier.com/hooks/catch/' + urlPath;

  if(ua !== 'HelloSign API' || !signature) {
    util.log('POST %s: Invalid request from %s (%s, %s)', urlPath, ip, ua, signature);

    return res.status(401).send('Missing Authorization Token');
  }

  req.pipe(request.post(zapierUrl)).on('response', function(response) {
    var bodyChunks = [];

    response.on('data', function(chunk) { bodyChunks.push(chunk); });

    response.on('end', function() {
      var body = Buffer.concat(bodyChunks);
      util.log('POST %s (%s): %s', urlPath, response.statusCode, body);

      res.send('Hello API Event Received');
    });
  });
});

app.listen(port, function () {
  util.log('Proxying to `%s` on port 3000.', zapierUrl);
});

