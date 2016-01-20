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

de.Block.Function.prototype._action = function( params, context ) {
    var block;
    try {
        block = this.block( params, context );

    } catch ( e ) {
        return no.promise.resolved( new de.Result.Error( de.error( {
            id: 'Неведомая хуйня'
        } ) ) );
    }

    block = de.Block.compile( block );

    return block._run( params, context );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

