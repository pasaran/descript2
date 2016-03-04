var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.jexpr = function( jexpr ) {
    if ( typeof jexpr === 'function' ) {
        return jexpr;
    }

    var compiled = no.jpath.expr( jexpr );

    return function( params, context, state, tree ) {
        //  FIXME: Кажется, тут нужно с undefined сравнивать.
        tree = tree || null;

        //  Второй параметр -- это root, в данном случае это просто tree.
        //  Третий параметр -- это jvars, т.е. "переменные", которые можно использовать
        //  в jpath'ах:
        //
        //      de.jexpr( 'params.foo || state.bar' )
        //
        return compiled( tree, tree, {
            params: params,
            context: context,
            state: state
        } );
    };
};

de.jexprs = function() {
    var l = arguments.length;
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

    var compiled = [];
    for ( var i = 0; i < l; i++ ) {
        compiled.push( no.jpath.expr( arguments[ i ] ) );
    }

    return function( params, context, state, tree ) {
        tree = tree || null;
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

module.exports = de;

