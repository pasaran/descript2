const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Function = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Function, de.Block );

de.Block.Function.prototype._type = 'function';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Function.prototype._init_block = function( raw_block ) {
    this.block = raw_block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Function.prototype._action = function( params, context, state ) {
    var r;
    try {
        r = this.block( params, context, state );

    } catch ( e ) {
        return no.promise.resolved( de.error( e ) );
    }

    if ( no.is_promise( r ) ) {
        return r;
    }

    //  FIXME: А может быть тут настоящий блок?
    if ( r instanceof de.Lazy ) {
        return r._run( params, context, state );
    }

    //  Если не отдавать здесь промис, то при context.redirect случится ошибка,
    //  т.к. это самое r будет считаться промисом и на нем будет вызван метод abort.
    //
    return no.promise.resolved( r );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

