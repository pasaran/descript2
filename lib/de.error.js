var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Error = function( error ) {
    this.error = error;
};

no.inherit( de.Error, no.Error );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Error.ID = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    INVALID_JSON: 'INVALID_JSON',
    DEPS_ERROR: 'DEPS_ERROR',
    DEPS_NOT_RESOLVED: 'DEPS_NOT_RESOLVED',
    BLOCK_GUARDED: 'BLOCK_GUARDED',
    BLOCK_TIMED_OUT: 'BLOCK_TIMED_OUT',
    REQUIRED_BLOCK_FAILED: 'REQUIRED_BLOCK_FAILED',
    REDIRECTED: 'REDIRECTED',
    TCP_CONNECTION_TIMEOUT: 'TCP_CONNECTION_TIMEOUT',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    HTTP_REQUEST_ABORTED: 'HTTP_REQUEST_ABORTED',
    HTTP_CYCLIC_REDIRECT: 'HTTP_CYCLIC_REDIRECT',
    HTTP_CONNECTION_CLOSED: 'HTTP_CONNECTION_CLOSED',
    HTTP_UNKNOWN_ERROR: 'HTTP_UNKNOWN_ERROR',
};

de.Error.MESSAGE = {
    UNKNOWN_ERROR: 'Unknown error',
    INVALID_JSON: 'Invalid JSON',
    DEPS_ERROR: 'Deps error',
    DEPS_NOT_RESOLVED: 'Deps cannot be resolved',
    BLOCK_GUARDED: 'Block guarded',
    REDIRECTED: 'Request redirected to %location',
    HTTP_CYCLIC_REDIRECT: 'Redirected to visited already url %url',
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
        };
    }

    if ( !error.id ) {
        error.id = de.Error.ID.UNKNOWN_ERROR;
    }

    var message = error.message || de.Error.MESSAGE[ error.id ];
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

