var no = require( 'nommon' );

var de = require( '../de.js' );
require( '../de.consts.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result = function() {};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.prototype.get_content_type = function() {
    return de.JSON_CONTENT_TYPE;
};

de.Result.prototype.select = function( jpath, vars ) {
    return no.jpath( jpath, this.as_object(), vars );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.prototype.is_json = function() {
    return this.get_content_type() === de.JSON_CONTENT_TYPE;
};

de.Result.prototype.is_text = function() {
    return de.TEXT_CONTENT_TYPES[ this.get_content_type() ];
};

de.Result.prototype.is_binary = function() {
    return !this.is_text();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.result = {};

de.result.is_error = function( error ) {
    return error instanceof de.Result.Error;
};

module.exports = de;

