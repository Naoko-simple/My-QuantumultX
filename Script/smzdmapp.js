/*
[Script]
http-response ^https?://user-api\.smzdm\.com/info requires-body=1,script-path=smzdm.js

[MITM]
hostname = *.smzdm.com
*/

let body = JSON.parse($response.body);

body["data"]["checkin"]["client_has_checkin"] =
  body["data"]["checkin"]["web_has_checkin"];

$done({ body: JSON.stringify(body) });
