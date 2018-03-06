/**
 * A lightweight module to send HTTP(s) requests from Node.js.
 * 
 * Input Params:
 * URL: URL to which the request is to be made. (Required)
 * Request init: 
 *  - method: eg. GET, POST. Default GET
 *  - headers [JSON Object]
 *  - body [JSON Object]
 *  - followredirect [Boolean]. Default true.
 * 
 * Returns a Promise
 * Output Params
 *  - headers
 *  - statusText
 *  - status
 *  - url
 *  - body
 * 
 */

const http = require('http'),
    https = require('https'),
    nodeurl = require('url'),
    querystring = require('querystring');

const fetch = (url, options) => {
    return new Promise((resolve, reject) => {
        const isJson = (str) => {
            try { return JSON.parse(str) } 
            catch (e) { return false }
        }
        const req = nodeurl.parse(url);
        const client = (req.protocol == 'https:') ? https : http;
        let body = '';
        req['method'] = options.method || 'GET';
        req['headers'] = {};
        options.headers && Object.keys(options.headers).forEach(key => req['headers'][key.toLowerCase()] = options.headers[key]);
        const thisReq = client.request(req, (res) => {
            if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && options.redirect != 'manual'){
                return resolve(fetch(res.headers.location, options));
            }
            res.on('data', (data) => body += data);
            res.on('end', (end) => resolve({
                headers: res.headers,
                status: res.statusCode,
                statusText: res.statusMessage,
                url: res.url || url,
                body: isJson(body) || body
            }));
            res.on('error', (err) => reject(err));
        });
        thisReq.setHeader('user-agent', 'fetch-lite[v1.0] (https://github.com/vasanthv/fetch-lite)');
        req['headers']['content-type'] || thisReq.setHeader('content-type', options.body ? 'application/x-www-form-urlencoded' : 'application/octet-stream');
        req['headers']['accept'] || thisReq.setHeader('accept', '*/*');
        options.body && thisReq.write( (typeof options.body === 'string' || Buffer.isBuffer(options.body)) ? options.body : querystring.stringify(options.body));
        thisReq.on('error', (err) => reject(err)).end();
    });
};


module.exports = (url, options) => url ? fetch(url, options || {}) : Promise.reject('URL is mandatory');