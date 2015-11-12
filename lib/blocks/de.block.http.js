var no = require( 'nommon' );

var de = require( './de.block.js' );
require( '../de.request.js' );

de.Block.Http = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Http, de.Block );

de.Block.Http.prototype._type = 'http';

//  ---------------------------------------------------------------------------------------------------------------  //

//  url
//  method
//  protocol
//  hostname
//  host
//  path
//  headers
//  query
//  body
//
de.Block.Http.prototype._init_block = function() {
    if ( typeof this.raw_block === 'function' ) {
        this.block = this.raw_block;

    } else {
        this.block = no.extend( {}, this.raw_block );

        this.block.url = compile_string( this.block.url );
        this.block.path = compile_string( this.block.path );
        this.block.hostname = compile_string( this.block.hostname );

        this.block.query = compile_object( this.block.query );
        this.block.body = compile_object( this.block.body );
    }
};

function compile_string( str ) {
    if ( str == null ) {
        return null;
    }

    return ( typeof str === 'function' ) ? str : no.jpath.string( str );
}

function compile_object( obj ) {
    if ( obj == null ) {
        return null;
    }

    return ( typeof obj === 'function' ) ? obj : no.jpath.expr( obj );
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  url
//  method
//  protocol
//  hostname
//  host
//  path
//  headers
//  query
//  body
//
de.Block.Http.prototype._run = function( params, context ) {
    var options;

    if ( typeof this.block === 'function' ) {
        options = this.block( params, context );

    } else {
        options = {};

        if ( this.block.url ) {
            options.url = this.block.url( params, context );
        }
        if ( this.block.method ) {
            options.method = this.block.method;
        }
        if ( this.block.protocol ) {
            options.protocol = this.block.protocol;
        }
        if ( this.block.hostname ) {
            options.hostname = this.block.hostname( params, context );
        }
        if ( this.block.path ) {
            options.path = this.block.path( params, context );
        }
        options.query = ( this.block.query ) ? this.block.query( params, context ) : params;
        if ( this.block.body ) {
            options.body = this.block.body( params, context );
        }
    }

    var promise = no.promise();

    var running = de.request( options, context );

    running.then(
        function( result ) {
            promise.resolve( new de.Result.Value( result ) );
        },
        function( error ) {
            promise.resolve( new de.Result.Error( error ) );
        }
    );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports =de;

