var request = require('./request');


// Stringify value; function members use their string representation
function toJsonWithFuncs(val) {
    return JSON.stringify(val, function (key, val) {
        return typeof(val) === 'function' ? val.toString() : val;
    });
}


function setDefault(obj, property, val) {
    if (typeof obj[property] !== 'undefined') return obj[property];
    return (obj[property] = val);
}


// Like request(), but send & accept JSON, and handle response codes
function jsonRequest(options, callback) {
    setDefault(options, 'headers', {});
    setDefault(options.headers, 'accept', 'application/json');
    setDefault(options.headers, 'content-type', 'application/json');
    // Working strictly with the API here, never want to redirect
    setDefault(options, 'followRedirect', false);
    // By default, expect normal success status codes
    setDefault(options, 'expect', [200, 201, 202]);

    if (options.body && typeof options.body !== 'string') {
        options.body = toJsonWithFuncs(options.body);
    }

    request(options, function couchCallback(err, resp, body) {
        // Create empty object if no body (e.g., HEAD requests)
        if (body === undefined || body.length === 0) body = '{}';

        // Try to parse the body into JSON; this is done even if the
        // response status is unexpected, since the body may be useful
        // in the callback's error handling.
        try {
            body = JSON.parse(body);
        }
        catch (e) {
            if (!e instanceof SyntaxError) throw e;

            if (!err) {
                // TODO: Is this consistent with how other errors are reported?
                err = e;
            }
        }

        // Now check if the response status is expected
        if (options.expect.indexOf(resp.statusCode) < 0) {
            if (!err) {
                err = new Error('Unexpected status code');
                err.type = 'unexpected_status';
                err.statusCode = resp.statusCode;
                err.toString = function () { return err.message + ': ' + err.statusCode; };
            }
        }

        return callback(err, resp, body);
    });
}


// Turn relative path to a file name into a CommonJS module reference
function normalizeModulePath(path) {
    if (!path.match(/^\.{0,2}\//)) path = './' + path;

    if (path.slice(path.lastIndexOf('.')) === '.js') {
        path = path.slice(0, -3);  // Remove extension
    }

    return path;
}


exports.toJsonWithFuncs = toJsonWithFuncs;
exports.jsonRequest = jsonRequest;
exports.normalizeModulePath = normalizeModulePath;

// vim:set sw=4 et:
