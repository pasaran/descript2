var fs_ = require( 'fs' );
var path_ = require( 'path' );

var no = require( 'nommon' );
var fs_ = require( 'fs' );

var de = require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var data_type_by_ext = {
    '.json': 'json',
    '.txt': 'text',
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.File, de.Block );

de.Block.File.prototype._type = 'file';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._init_block = function() {
    var raw_block = this.raw_block;

    this.block = {};
    this.block.filename = no.jpath.string( raw_block.filename );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._run = function( params, context ) {
    var filename = this.resolve_filename( this.block.filename( params, context ) );

    var data_type = this.options.data_type;
    if ( !data_type ) {
        var ext = path_.extname( filename );
        data_type = data_type_by_ext[ ext ];
    }

    var promise = no.promise();

    fs_.readFile( filename, function( error, result ) {
        if ( error ) {
            promise.resolve( no.result.error( error ) );

        } else {
            if ( data_type === 'json' ) {
                try {
                    result = JSON.parse( result );
                    promise.resolve( new de.Result.Value( result, data_type ) );

                } catch ( e ) {
                    promise.resolve( no.result.error( e ) );
                }

            } else {
                promise.resolve( new de.Result.Raw( result, data_type ) );
            }
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

