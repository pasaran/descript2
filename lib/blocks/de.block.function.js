var no = require( 'nommon' );

var de = require( './de.block.js' );

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
    var block;

    try {
        block = this.block( params, context, state );

    } catch ( e ) {
        return no.promise.resolved( de.error( e ) );
    }

    block = de.Block.compile( block );

    return block._run( params, context, state );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

