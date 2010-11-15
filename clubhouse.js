var ddoc = {
    _id: '_design/clubhouse',

    views: {
        membersByClub: {
            map: function (doc) {
                emit([doc.club, doc.name], null);
            }
        }
    },

    lists: {
        basic: function (head, req) {
            provides('html', function () {
                send('<html><head><title>bugs</title></head><body>');
                var row;
                while (row = getRow()) {
                    send('<p>' + row.key[0] + ', ' + row.key[1] + '</p>\\n');
                }
                return '</body></html>\\n';
            });
        }
    }
};
exports.ddoc = ddoc;
