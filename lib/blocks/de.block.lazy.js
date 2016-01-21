var no = require( 'nommon' );

var de = require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy = function( ctor, block, options ) {
    this._init( ctor, block, options );
};

de.Block.Lazy.prototype = Object.create( Function.prototype );

//  NOTE: de.Block.Lazy не является instanceof de.Block!

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.create_factory = function( ctor ) {
    var factory = function( block, options ) {
        var f = function( new_block, new_options ) {
            return ( arguments.length === 1 ) ? f.extend( null, new_block ) : f.extend( new_block, new_options );
        };

        f.__proto__ = de.Block.Lazy.prototype;
        f._init( ctor, block, options );

        return f;
    };

    return factory;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype.get_id = function() {
    return this.options.id;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype._run = function( params, context ) {
    var compiled = this._compile();

    return context.run( compiled, params );
};

de.Block.Lazy.prototype._compile = function() {
    var compiled = this._compiled;

    if ( !compiled ) {
        compiled = this._compiled = new this.ctor( this.block, this.options );
    }

    return compiled;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype._init = function( ctor, block, options ) {
    this.ctor = ctor;
    this.block = block;
    this._init_options( options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Lazy.prototype._init_options = function( options ) {
    this.options = no.extend( {}, de.Block.DEFAULT_OPTIONS, options );

    this.options.id = this.options.id || de.Block.generate_id();

    this.options.valid_params = compile_valid_params( this.options.valid_params );
};

function compile_valid_params( valid_params ) {
    if ( !valid_params ) {
        return null;
    }

    if ( !Array.isArray( valid_params ) ) {
        return valid_params;
    }

    var result = {};
    for ( var i = 0, l = valid_params.length; i < l; i++ ) {
        result[ valid_params[ i ] ] = null;
    }
    return result;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Варианты вызова:
//
//      block.extend( block, options )
//      block.extend( block )
//      block.extend( block, null )
//      block.extend( null, options )
//
de.Block.Lazy.prototype.extend = function( block, options ) {
    block = ( block ) ? extend_block( this.block, block ) : clone_block( this.block );
    options = ( options ) ? extend_options( this.options, options ) : clone_options( this.options );

    return new de.Block.Lazy( this.ctor, block, options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function extend_block( what, by ) {
    if ( typeof what === 'object' && typeof by === 'object' ) {
        return no.extend( {}, what, by );
    }

    //  FIXME: А зачем тут ошибка? Если там строка, то пусть перетирает и все?
    if ( what && by ) {
        //  FIXME.
        throw Error( 'Cannot extend block' );
    }

    return by || what;
}

function clone_block( block ) {
    if ( typeof block === 'object' ) {
        return no.extend( {}, block );
    }

    return block;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function extend_options( what, by ) {
    var options = {};

    options.id = by.id;

    options.deps = extend_option( what.deps, by.deps );

    options.valid_params = extend_valid_params( what.valid_params, by.valid_params );
    //  FIXME: Тут что-то более сложное должно быть.
    options.params = extend_option( what.params, by.params );

    options.guard = extend_option( what.guard, by.guard );

    options.before = extend_option( by.before, what.before );
    options.after = extend_option( what.after, by.after );

    options.select = extend_option( what.select, by.select );
    options.result = extend_option( what.result, by.result );

    options.timeout = by.timeout || what.timeout;

    options.key = by.key || what.key;
    options.maxage = by.maxage || what.maxage;

    options.transform = extend_option( what.transform, by.transform );

    options.dirname = by.dirname || what.dirname;

    return options;
}

function clone_options( options ) {
    options = no.extend( {}, options );
    delete options.id;

    return options;
}

function extend_option( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    return [].concat( what, by );
}

function extend_valid_params( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    var params = no.extend( {}, what );

    for ( var p_name in by ) {
        var p_value = by[ p_name ];

        if ( p_value != null ) {
            params[ p_name ] = p_value;

        } else if ( params[ p_name ] === undefined ) {
            params[ p_name ] = null;

        }
    }

    return params;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

