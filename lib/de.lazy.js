const de = require( './de.js' );

require( './de.block.file.js' );
require( './de.block.http.js' );
require( './de.block.value.js' );
require( './de.block.function.js' );
require( './de.block.array.js' );
require( './de.block.object.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _block_id = 0;

function generate_id() {
    return 'block-' + _block_id++;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Lazy = function( ctor, info ) {
    return factory( ctor, info );
};

de.Lazy.prototype = Object.create( Function.prototype );

//  ---------------------------------------------------------------------------------------------------------------  //

function factory( ctor, info ) {
    const f = function( new_info ) {
        var f_ = f._clone();

        const block = new_info.block;
        if ( block ) {
            //  FIXME: А почему тут проверка на массив?
            //  По идее, у Block.Array нет метода _extend_block?
            //
            if ( ctor._extend_block && ( typeof block === 'object' ) && !Array.isArray( block ) ) {
                f_.block = ctor._extend_block( f.block, block );

            } else {
                f.block = block;
            }
        }

        const options = new_info.options;
        if ( options ) {
            f_.options.push( options );

            f_.id = options.id;
        }

        f_.id = f_.id || generate_id();

        return f_;
    };

    f.__proto__ = de.Lazy.prototype;
    f._init( ctor, info );

    return f;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Lazy.prototype._init = function( ctor, info ) {
    this.ctor = ctor;

    this.block = info.block;

    const options = info.options;
    if ( options ) {
        if ( Array.isArray( options ) ) {
            this.options = [].concat( options );

            //  FIXME: А не нужно ли доставать id из последних options?

        } else {
            this.options = [ options ];

            this.id = options.id;
        }

    } else {
        this.options = [];
    }

    this.id = this.id || generate_id();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Lazy.prototype._clone = function() {
    //  FIXME: Не теряется ли id при клонировании?
    return factory( this.ctor, {
        block: this.block,
        options: this.options
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Lazy.prototype.get_id = function() {
    return this.id;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Lazy.prototype._run = function( params, context ) {
    var compiled = this._compile();

    return context.run( compiled, params );
};

de.Lazy.prototype._compile = function() {
    var compiled = this._compiled;

    if ( !compiled ) {
        compiled = this._compiled = new this.ctor( this.block, this.options );

        compiled.id = this.id;
    }

    return compiled;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function block_factory( ctor ) {
    return function( block, options ) {
        return factory( ctor, block, options );
    };
}

de.http = block_factory( de.Block.Http );
de.file = block_factory( de.Block.File );
de.value = block_factory( de.Block.Value );
de.func = block_factory( de.Block.Function );
de.array = block_factory( de.Block.Array );
de.object = block_factory( de.Block.Object );

de.block = function( block ) {
    if ( block instanceof de.Block || block instanceof de.Lazy ) {
        return block;
    }

    if ( Array.isArray( block ) ) {
        return de.array( { block: block } );
    }

    if ( block && typeof block === 'object' ) {
        return de.object( { block: block } );
    }

    if ( typeof block === 'function' ) {
        return de.func( { block: block } );
    }

    return de.value( { block: block } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

