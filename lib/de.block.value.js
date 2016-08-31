const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Value = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Value, de.Block );

de.Block.Value.prototype._type = 'value';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Value.prototype._init_block = function( raw_block ) {
    this.block = raw_block;
};

de.Block.Value.prototype._action = function( params, context, state ) {
    return this.block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

