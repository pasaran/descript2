var no = require( 'nommon' );

var de = require( './de.result.js' );
require( './de.result.raw.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Http = function( status_code, headers, buffer, options ) {
    this.status_code = status_code;
    this.headers = headers;
    this.buffer = buffer;

    if ( options ) {
        this.content_type = options.content_type;
        this.meta_only = options.meta_only;
        this.dont_parse = options.dont_parse;
    }
    if ( !this.content_type ) {
        this.content_type = headers[ 'content-type' ] || de.DEFAULT_CONTENT_TYPE;
    }

};

no.inherit( de.Result.Http, de.Result.Raw );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Http.prototype._as_string = function() {
    if ( this.meta_only ) {
        return JSON.stringify( this.as_object() );
    }

    return this.buffer.toString();
};

de.Result.Http.prototype._as_object = function() {
    if ( this.meta_only ) {
        return {
            status_code: this.status_code,
            headers: this.headers
        };
    }

    try {
        return JSON.parse( this.as_string() );

    } catch ( e ) {
        return {


        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports;

