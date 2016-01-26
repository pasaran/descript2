var no = require( 'nommon' );

var de = require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Custom = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Custom, de.Block );

de.Block.Custom.prototype._type = 'custom';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Custom.prototype._init_block = function( raw_block ) {
    this.block = raw_block;
};

de.Block.Custom.prototype._action = function( params, context, state ) {
    return this.block( params, context, state );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

