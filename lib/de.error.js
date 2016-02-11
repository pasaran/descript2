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
    BLOCK_GUARDED: 'Block guarded',
    BLOCK_TIME_OUT: 'Block timed out',
    REDIRECTED: 'Request redirected to %location'
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.error = function( error, id ) {
    if ( error instanceof de.Error ) {
        return error;
    }

    if ( error instanceof Error ) {
        var _error = {
            id: id || error.name,
            message: error.message,
            stack: error.stack
        };

        if ( error.errno ) {
            _error.errno = error.errno;
        }
        if ( error.code ) {
            _error.code = error.code;
        }
        if ( error.syscall ) {
            _error.syscall = error.syscall;
        }

        return new de.Error( _error );
    }

    if ( typeof error === 'string' ) {
        error = {
            id: error
        }
    }

    if ( !error.id ) {
        error.id = 'UNKNOWN_ERROR';
    }

    var message = error.message || ERRORS[ error.id ];
    if ( message ) {
        error.message = message.replace( /%(\w+)/g, function( _, name ) {
            return error[ name ] || _;
        } );
    }

    return new de.Error( error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.is_error = function( error ) {
    return ( error instanceof de.Error || error instanceof Error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

