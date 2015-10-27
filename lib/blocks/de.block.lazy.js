var no = require( 'nommon' );

var de = require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy = function( ctor, block, options ) {
    this._init( ctor, block, options );
};

de.Block.Lazy.prototype = Object.create( Function.prototype );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.create_factory = function( ctor ) {
    var factory = function( block, options ) {
        var f = function( new_block, new_options ) {
            return f.clone( new_block, new_options );
        };

        f.__proto__ = de.Block.Lazy.prototype;
        f._init( ctor, block, options );

        return f;
    };

    return factory;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype._init = function( ctor, block, options ) {
    this.ctor = ctor;
    this.block = block;
    this.options = options || {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype.compile = function( options ) {
    var compiled = this._compiled;

    if ( !compiled ) {
        var ctor = this.ctor;

        no.extend( this.options, options );
        compiled = new ctor( this.block, this.options );
    }

    return compiled;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  Варианты использования:
//
//      block.clone( extend_options );
//      block.clone( extend_block, extend_options );
//
de.Block.Lazy.prototype.clone = function( block, options ) {
    if ( arguments.length < 2 ) {
        options = block;
        block = null;
    }

    block = ( block ) ? de.Block.extend_block( this.block, block ) : no.extend( {}, this.block );
    options = ( options ) ? de.Block.extend_options( this.options, options ) : no.extend( {}, this.options );

    return new de.Block.Lazy( this.ctor, block, options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype.run = function( params, context ) {
    var compiled = this.compile();

    return compiled.run( params, context );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

