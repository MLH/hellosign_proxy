var express = require('express')
  , multer  = require('multer')()
  , request = require('request')
  , util = require('util')
  , port = process.env.PORT || 3000
  , app = express();

app.post('/*', multer.single(), function (req, res) {
  var ua = req.get('User-Agent')
    , signature = req.get('Content-MD5')
    , ip = ip = req.get('x-forwarded-for') || req.connection.remoteAddress
    , urlPath = req.params[0]
    , zapierUrl = 'https://hooks.zapier.com/hooks/catch/' + urlPath
    , event;

  if(ua !== 'HelloSign API' || !signature) {
    util.log('POST %s: Invalid request from %s (%s, %s)', urlPath, ip, ua, signature);

    return res.status(401).send('Missing Authorization Token');
  }

  try {
    event = eventFromRequestBody(req.body.json);
  } catch(e) {
    util.log('POST %s: Invalid JSON from %s (%s)', urlPath, ip, req.body.json);
    util.log(e);

    return res.status(500).send('Malformed JSON body.');
  }

  util.log('POST %s: Received `%s` Event', urlPath, event.type);

  request.post(zapierUrl, { json: event }, function(err, response, body) {
    util.log('POST %s (%s): %s', urlPath, response.statusCode, JSON.stringify(body));
    res.send('Hello API Event Received');
  });

});

app.listen(port, function () {
  util.log('Proxying on port %s.', port);
});

/*
 * eventFromRequestBody
 *
 * Creates an event object from the HelloSign post body.
 */
function eventFromRequestBody(rawBody) {
  var result, event, signatureReq, body
    , allowedEventTypes = [
        'signature_request_viewed', 'signature_request_signed', 'signature_request_sent',
        'signature_request_remind', 'signature_request_all_signed'
      ];

  body = JSON.parse(rawBody);
  event = body.event;
  signatureReq = body.signature_request;

  result = {
    event: event.event_type,
    event_hash: event.event_hash,
    occurred_at: event.event_time
  }

  if(allowedEventTypes.indexOf(result.event) > -1) {
    Object.assign(result, {
      document_id: signatureReq.signature_request_id,
      requested_by: signatureReq.requester_email_address,
      title: signatureReq.title,
      email: {
        subject: signatureReq.subject,
        message: signatureReq.message
      },
      signed: signatureReq.is_complete,
      download: signatureReq.files_url,
      total_signatures: signatureReq.signatures.length,
      total_collected_signatures: signatureReq.signatures.reduce(function(agg, signature) {
        if(signature.status_code == 'signed') {
          return agg + 1;
        } else {
          return agg;
        }
      }, 0)
    });
  }

  if(result.event == 'signature_request_viewed' || result.event == 'signature_request_signed') {
    var sigID = event.event_metadata.related_signature_id
      , signature = signatureReq.signatures.filter(function(x) { return x.signature_id == sigID; })[0]
      , responses = signatureReq.response_data.filter(function(x) { return x.signature_id == sigID; })
      , attrName;

    result.signature = {
      id: sigID,
      name: signature.signer_name,
      email: signature.signer_email_address,
      signed_at: signature.signed_at,
      last_viewed_at: signature.last_viewed_at
    };

    for(var i = 0; i < responses.length; i++) {
      attrName = responses[i].name || responses[i].api_id;
      if(responses[i].type == "signature") {
        result.signature[attrName] = "signed";
      } else {
        result.signature[attrName] = responses[i].value;
      }
    }
  }

  return result;
}
