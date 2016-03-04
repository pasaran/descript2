var no = require( 'nommon' );

var de = require( '../lib/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports.port = 9999;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports.wrap = function( callback, timeout ) {
    return function( params, context, state ) {
        if ( timeout ) {
            var promise = no.promise();

            setTimeout( function() {
                var value = ( typeof callback === 'function' ) ? callback( params, context, state ) : callback;

                promise.resolve( value );
            }, timeout );

            return promise;

        } else {
            var value = ( typeof callback === 'function' ) ? callback( params, context, state ) : callback;

            return no.promise.resolved( value );
        }
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports.context = function( config ) {
    var context = new de.Context.Base( config );

    return context;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports.wrap_done = function( done, n ) {
    return function() {
        if ( !--n ) {
            done();
        }
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

