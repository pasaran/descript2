var no = require( 'nommon' );

var de = require( './de.block.js' );
require( '../results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Object, de.Block );

de.Block.Object.prototype._type = 'object';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object.prototype._init_block = function( block ) {
    var raw_block = this.raw_block;

    var options = { dirname: this.options.dirname };

    var block = this.block = [];
    var keys = this.keys = [];
    for ( var key in raw_block ) {
        keys.push( key );
        block.push( de.Block.compile( raw_block[ key ], options ) );
    }
};

de.Block.Object.prototype._run = function( params, context ) {
    var block = this.block;
    var keys = this.keys;

    var promises = {};

    for ( var i = 0, l = block.length; i < l; i++ ) {
        var item = block[ i ];
        var key = keys[ i ];

        promises[ key ] = item.run( params, context );
    }

    return no.promise.all( promises )
        .then( function( result ) {
            return new de.Result.Object( result );
        } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

