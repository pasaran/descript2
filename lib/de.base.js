var no = require( 'nommon' );

var de = require( './de.js' );

de.jexpr = function( jexpr ) {
    if ( typeof jexpr === 'function' ) {
        return jexpr;
    }

    var compiled = no.jpath.expr( jexpr );

    return function( params, context, state, result ) {
        result = result || null;

        //  Второй параметр -- это root, в данном случае это просто result.
        //  Третий параметр -- это jvars, т.е. "переменные", которые можно использовать
        //  в jpath'ах:
        //
        //      de.jexpr( 'params.foo || state.bar' )
        //
        return compiled( result, result, {
            params: params,
            context: context,
            state: state
        } );
    };
};

module.exports = de;

