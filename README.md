HelloSign-Zapier Proxy
===========================

This is a simple proxy between HelloSign's Webhooks and Zapier.

## API

### POST /*

Any requests POSTed to the API will be forwarded to the relevant Zapier URL.
The request path will be appended to `https://hooks.zapier.com/hooks/catch/`,
which is the format for Zapier Webhooks.  For example, a POST to `/foo/bar`
will proxy to `https://hooks.zapier.com/hooks/catch/foo/bar`.

In order to ensure that POST requests are coming from HelloSign, the API will
check for the presence of a User Agent and Body Hash.  Bad requests will
result in a 401 response.
