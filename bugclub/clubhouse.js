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
            var that = this;
            provides('html', function () {
                var to_html = require('modules/mustache').to_html;
                var members = [];

                var row;
                while (row = getRow()) {
                    members.push({club: row.key[0], name: row.key[1]});
                }

                return to_html(that.templates['roster.mustache'], { members: members });
            });
        }
    }
};
exports.ddoc = ddoc;
