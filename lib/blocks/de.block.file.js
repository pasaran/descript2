var no = require( 'nommon' );
var fs_ = require( 'fs' );

var de = require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var data_type_by_ext = {
    '.json': 'json',
    '.txt': 'text',
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File = function() {};

no.inherit( de.Block.File, de.Block );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._run = function( params, context ) {
    var filename = this.resolve_filename( this.filename( params, context ) );

    var data_type = this.options.data_type;
    if ( !data_type ) {
        var ext = path_.extname( filename );
        data_type = data_type_by_ext[ ext ];
    }

    var promise = no.promise();

    fs.readFile( filename, function( error, result ) {
        if ( error ) {
            promise.resolve( no.result.error( error ) );

        } else {
            promise.resolve( no.result.buffer( result, data_type ) );
        }
    } );

    return promise();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

