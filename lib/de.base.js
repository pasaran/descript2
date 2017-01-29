var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.jexpr = function( expr ) {
    if ( expr == null ) {
        return null;
    }

    return ( typeof expr === 'string' ) ? wrap_compiled( no.jpath.expr( expr ) ) : compile( expr );
};

de.jstring = function( expr ) {
    if ( expr == null ) {
        return null;
    }

    return wrap_compiled( no.jpath.string( expr ) );
};

function compile( expr ) {
    if ( typeof expr === 'function' ) {
        return expr;

    } else if ( expr && typeof expr === 'object' ) {
        return ( Array.isArray( expr ) ) ? compile_array( expr ) : compile_object( expr );

    } else {
        return function() {
            return expr;
        };
    }
}

//  FIXME: Стырить код из de.block.http.js.
//
function compile_object( object ) {
    var compiled = {};
    for ( var key in object ) {
        compiled[ key ] = compile( object[ key ] );
    }

    return function( params, context, state, tree ) {
        var result = {};

        for ( var key in compiled ) {
            result[ key ] = compiled[ key ]( params, context, state, tree );
        }

        return result;
    };
}

function compile_array( array ) {
    var compiled = [];
    var l = array.length;
    for ( var i = 0; i < l; i++ ) {
        compiled.push( compile( array[ i ] ) );
    }

    return function( params, context, state, tree ) {
        var result = [];

        for ( var i = 0; i < l; i++ ) {
            result.push( compiled[ i ]( params, context, state, tree ) );
        }

        return result;
    };
}

function wrap_compiled( compiled ) {
    return function( params, context, state, tree ) {
        return compiled( tree, tree, {
            params: params,
            context: context,
            state: state
        } );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.jexprs = function() {
    var l = arguments.length;
    /*
    if ( l === 1 ) {
        var compiled = no.jpath.expr( arguments[ 0 ] );

        return function( params, context, state, tree ) {
            //  FIXME: Кажется, тут нужно с undefined сравнивать.
            tree = tree || null;

            //  Второй параметр -- это root, в данном случае это просто tree.
            //  Третий параметр -- это jvars, т.е. "переменные", которые можно использовать
            //  в jpath'ах:
            //
            //      de.jexpr( 'params.foo || state.bar' )
            //
            var result = compiled( tree, tree, {
                params: params,
                context: context,
                state: state
            } );

            if ( result === undefined ) {
                return [];
            }

            return ( Array.isArray( result ) ) ? result : [ result ];
        };
    }
    */

    var compiled = [];
    for ( var i = 0; i < l; i++ ) {
        compiled.push( no.jpath.expr( arguments[ i ] ) );
    }

    return function( params, context, state, tree ) {
        var jvars = {
            params: params,
            context: context,
            state: state
        };

        var results = [];
        for ( var i = 0; i < l; i++ ) {
            var result = compiled[ i ]( tree, tree, jvars );

            if ( result !== undefined ) {
                results = results.concat( result );
            }
        }
        return results;
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.promise = no.promise;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

