var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Error = function( error ) {
    this.error = error;
};

no.inherit( de.Error, no.Error );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERRORS = {
    UNKNOWN_ERROR: 'Unknown error',
    INVALID_JSON: 'Invalid JSON',
    DEPS_ERROR: 'Deps cannot be resolved',
    BLOCK_GUARDED: 'Block guarded'
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.error = function( id, params ) {
    var error;

    if ( !id ) {
        id = 'UNKNOWN_ERROR';
    }

    if ( id instanceof Error ) {
        error = {
            id: params || id.name,
            message: id.message,
            stack: id.stack
        };

        if ( id.errno ) {
            error.errno = id.errno;
        }
        if ( id.code ) {
            error.code = id.code;
        }
        if ( id.syscall ) {
            error.syscall = id.syscall;
        }

    } else if ( typeof id === 'string' ) {
        error = { id: id };

        var message = format_message( ERRORS[ id ], params );
        if ( message ) {
            error.message = message;
        }

    } else {
        error = id;
        if ( error.message ) {
            error.message = format_message( error.message, params );
        }
    }

    return new de.Error( error );
};

function format_message( message, params ) {
    if ( !message ) {
        return '';
    }

    if ( params ) {
        message = message.replace( /%(\w+)/g, function( _, name ) {
            return params[ name ] || '';
        } );
    }

    return message;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.is_error = function( error ) {
    return ( error instanceof de.Error || error instanceof Error );
};


//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

