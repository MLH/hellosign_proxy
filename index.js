var express = require('express')
  , util = require('util')
  , zapierUrl = process.env.ZAPIER_WEBHOOK
  , port = process.env.PORT || 3000
  , app = express();

if(!zapierUrl) {
  throw Error('Missing Zapier Webhook URL. Please set `ZAPIER_WEBHOOK` Env Variable.');
}

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(port, function () {
    util.log('Proxying to `%s` on port 3000.', zapierUrl);
});

