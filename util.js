/*
    Utility functions

    Copyright 2010 by Tim Smith <tim@couchone.com>
    Released under the BSD license; see ./LICENSE.markdown
*/

// Non-default modules, available from, among other places,
// NPM, a Node Package Manager: http://howtonode.org/introduction-to-npm
var request = require('request');

// Default node.js modules
var fs = require('fs');
var path = require('path');
var sys = require('sys');
var url = require('url');


var log = exports.log = sys.log;

// Stringify value; function members use their string representation
var toJsonWithFuncs = exports.toJsonWithFuncs = function toJsonWithFuncs(val) {
    return JSON.stringify(val, function (key, val) {
        return typeof(val) === 'function' ? val.toString() : val;
    });
};

// Copy items from 'from' to 'to', unless they're already there
// Literal objects/arrays are deep copied, everything else is shallow
var setDefault = exports.setDefault = function setDefault(to, from) {
    var member;
    for (member in from) {
        if (from.hasOwnProperty(member)) {
            if (typeof from[member] === 'object' &&
                (from[member].constructor === Object || from[member].constructor === Array))
            {
                // Simple object, do a deep copy
                if (!to[member]) {
                    to[member] = from[member].constructor === Object ? {} : [];
                }
                setDefault(to[member], from[member]);
            }
            else if (to[member] === undefined) {
                to[member] = from[member];
            }
        }
    }

    return to;
};

// Like request(), but send & accept JSON, and handle response codes / errors
// Reuse client connection (keep-alive)
var jsonRequest = exports.jsonRequest = (function () {
    var clientHandle;

    return function jsonRequest(options, callback) {
        setDefault(options, {
            //client: clientHandle,
            headers: {
                Accept: 'application/json',
                Content_Type: 'application/json'
                //Connection: 'Keep-Alive'
            },
            // Working strictly with the API, never want to redirect
            followRedirect: false,
            // By default, expect normal success status codes
            expect: [200, 201, 202],
            // Don't tolerate errors, by default
            handleError: function (err, resp, body) {
                sys.debug("FATAL: " + sys.inspect(body));
                throw err;
            }
        });

        if (options.body && typeof options.body !== 'string') {
            options.body = toJsonWithFuncs(options.body);
        }

        //sys.debug('Ready to issue request: ' + sys.inspect({ options: options }));

        var safe_uri = url.parse(options.uri);
        // Seems that url.format() doesn't consider the auth member. Annoying.
        //if (safe_uri.auth) { safe_uri.auth = 'USER:PASS'; }
        if (safe_uri.auth) {
            safe_uri.host = safe_uri.host.replace(/^.*@/, 'USER:HOST@');
        }

        log((options.method || 'GET') + ' ' + url.format(safe_uri));
        request(options, function couchCallback(err, resp, body) {
            if (!clientHandle) { clientHandle = resp.client; }

            // Create empty object if no body (e.g., HEAD requests)
            if (body === undefined || body.length === 0) { body = '{}'; }

            // Try to parse the body into JSON; this is done even if the
            // response status is unexpected, since the body may be useful
            // in the callback's error handling.
            try {
                body = JSON.parse(body);
            }
            catch (e) {
                sys.debug('FAILED to parse body: ' + e);
                if (!e instanceof SyntaxError) { throw e; }

                if (!err) {
                    // TODO: Is this consistent with how other errors are reported?
                    err = e;
                }
            }

            // Now check if the response status is expected
            if (!err && resp && options.expect.indexOf(resp.statusCode) < 0) {
                err = new Error('Unexpected status code');
                err.type = 'unexpected_status';
                err.statusCode = resp.statusCode;
                err.toString = function () { return err.message + ': ' + err.statusCode; };
            }

            // handleError can be explicitly disabled with options = { handleError: null }
            if (err && options.handleError) {
                return options.handleError(err, resp, body);
            }

            return callback(err, resp, body);
        });
    };
})();

var findFilesSync = exports.findFilesSync = function findFilesSync(top) {
    var result = [];
    if (top === undefined) { return result; }

    function walk(rel) {
        var relPath = path.join.apply(rel, rel);
        var fullPath = path.join(top, relPath);
        try {
            var stats = fs.statSync(fullPath);
        }
        catch (e) {
            if (e.errno && e.errno === 2) {
                // No such file; just skip it
                return;
            }

            throw e;
        }

        if (stats.isDirectory()) {
            fs.readdirSync(fullPath).forEach(function (f) {
                if (f[0] !== '.') {
                    walk(rel.concat(f));
                }
            });
        }
        else if (stats.isFile()) {
            result.push(relPath);
        }
    }

    walk([]);
    //sys.debug(sys.inspect(result));
    return result;
};
