var no = require( 'nommon' );

var de = require( './de.block.js' );

de.Block.Value = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Value, de.Block );

de.Block.Value.prototype._type = 'value';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Value.prototype._init_block = function() {
    this.block = this.raw_block;
};

de.Block.Value.prototype._action = function( params, context ) {
    //  FIXME: Нельзя ли просто `this.block` возвращать?
    return no.promise.resolved( new de.Result.Value( this.block ) );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

