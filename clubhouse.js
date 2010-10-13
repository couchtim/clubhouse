var ddoc = {
    _id: '_design/clubhouse',

    views: {
        members: {
            map: function (doc) { emit([doc.club, doc.name], null); }
        }
    },

    lists: {
        flat: function (head, req) {
            start({headers: { 'Content-type': 'text/html' }});
            send('<html><head><title>bugs!</title></head><body>');
            var row;
            while ((row = getRow())) {
                send('<p>' + row.key[0] + ', ' + row.key[1] + '</p>\n');
            } return '</body></html>\n';
          }
    }
};

exports.ddoc = ddoc;
exports.dbUri = 'http://tim:topSecret@couchtim.couchone.com:5984/bugclub';
