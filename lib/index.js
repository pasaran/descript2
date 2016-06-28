var path_ = require( 'path' );

var de = require( './de.js' );

require( './de.base.js' );
require( './de.error.js' );

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
        //  FIXME: А это вообще не может работать.
        //  Что тут должно быть? de.block? de.compile?
        //
        throw 'FIXME!';
        //  block = de( block, { dirname: dirname } );
    }

    _require_cache[ filename ] = block;

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Нужно пробрасывать сюда dirname?
//  Если блок это подблок в Block.Array или Block.Object, у которых выставлен dirname.
//
de.compile = function( block ) {
    if ( block instanceof de.Block ) {
        return block;

    } else if ( block instanceof de.Lazy ) {
        return block._compile();

    } else if ( Array.isArray( block ) ) {
        return new de.Block.Array( block );

    } else if ( block && typeof block === 'object' ) {
        return new de.Block.Object( block );

    } else if ( typeof block === 'function' ) {
        return new de.Block.Function( block );

    /*
    } if ( no.is_runable( block ) ) {
        return block;
    */

    } else {
        return new de.Block.Value( block );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

