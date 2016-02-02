var no = require( 'nommon' );

var de = require( '../lib/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _port = 8080;

module.exports.port = function() {
    return _port++;
};

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
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports.context = function() {
    var context = new de.Context();

    context.logger.set_level( de.Logger.LEVEL.OFF );

    return context;
}

//  ---------------------------------------------------------------------------------------------------------------  //

