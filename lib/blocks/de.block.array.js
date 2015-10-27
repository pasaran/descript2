var de = require( './de.block.js' );

var no = require( 'nommon' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Array, de.Block );

de.Block.Array.prototype._type = 'array';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._init_block = function() {
    var raw_block = this.raw_block;

    var options = { dirname: this.options.dirname };

    var block = this.block = [];
    for ( var i = 0, l = raw_block.length; i < l; i++ ) {
        var item = raw_block[ i ];
        block.push( de.Block.compile( item, options ) );
    }
};

de.Block.Array.prototype._run = function( params, context ) {
    var promises = [];

    var block = this.block;
    for ( var i = 0, l = block.length; i < l; i++ ) {
        promises.push( this.block[ i ].run( params, context ) );
    }

    var promise = no.promise.wait( promises );

    promise.on( 'abort', function( reason ) {
        for ( var i = 0, l = promises.length; i < l; i++ ) {
            promises[ i ].trigger( 'abort', reason );
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

