var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.ERROR = {
    INVALID_JSON: 'Invalid JSON'
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.error = function( id, params ) {
    var error;

    if ( id instanceof Error ) {
        error = {
            id: id.name,
            message: id.message,
            stack: id.stack
        };

    } else if ( typeof id === 'string' ) {
        var message = de.ERROR[ id ];
        if ( message && params ) {
            message = message.replace( /%(\w+)/g, function( _, name ) {
                return params[ name ] || '';
            } );
        }

        error = {
            id: id
        };
        if ( message ) {
            error.message = message;
        }

    } else {
        error = id;
    }

    return error;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

