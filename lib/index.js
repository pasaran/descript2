var path_ = require( 'path' );

var de = require( './de.js' );

require( './de.base.js' );
require( './de.error.js' );

require( './de.cache.js' );
require( './de.context.js' );
require( './de.lazy.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _require_cache = {};

//  ---------------------------------------------------------------------------------------------------------------  //

de.require = function( filename ) {
    if ( !path_.isAbsolute( filename ) ) {
        //  FIXME.
        throw new Error( 'Error' );
    }

    //  FIXME: Не нужно ли как-то по-другому нормализовать filename?
    filename = path_.resolve( filename );

    var cached = _require_cache[ filename ];
    if ( cached ) {
        return cached;
    }

    var dirname = path_.dirname( filename );

    var block = require( filename );
    if ( block instanceof de.Lazy ) {
        block = block._clone();

        //  FIXME: А как-то более цивильно это можно сделать?
        block.options.push( { dirname: dirname } );

    } else {
        block = de.compile( block, { dirname: dirname } );
    }

    _require_cache[ filename ] = block;

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Нужно пробрасывать сюда dirname?
//  Если блок это подблок в Block.Array или Block.Object, у которых выставлен dirname.
//
de.compile = function( block, options ) {
    if ( block instanceof de.Block ) {
        return block;

    } else if ( block instanceof de.Lazy ) {
        return block._compile();

    } else if ( Array.isArray( block ) ) {
        return new de.Block.Array( block, options );

    } else if ( block && typeof block === 'object' ) {
        return new de.Block.Object( block, options );

    } else if ( typeof block === 'function' ) {
        return new de.Block.Function( block, options );

    /*
    } if ( no.is_runable( block ) ) {
        return block;
    */

    } else {
        //  FIXME: Тут вроде не нужны options. Да и блок лучше передавть как есть.
        return new de.Block.Value( block, options );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

