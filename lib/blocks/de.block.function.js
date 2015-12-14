var no = require( 'nommon' );

var de = require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Function = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Function, de.Block );

de.Block.Function.prototype._type = 'function';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Function.prototype._init_block = function() {
    this.block = this.raw_block;
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

    return de.Block.compile( block ).run( params, context );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

