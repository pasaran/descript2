// vim: set filetype=javascript:

var no = require( 'nommon' );

var de = require( '../../../lib/index.js' );

module.exports = de.block( function() {
    return no.promise.resolved( {
        foo: {
            bar: 42
        }
    } );
} );

