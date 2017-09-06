var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Log = function( config ) {
    config = config || {};

    this._debug = config.debug;
    this._date_formatter = no.date.formatter( config.date_format || '%d.%m.%Y %H:%M:%S.%f' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Log.prototype.error = function( message ) {
    this._log( process.stderr, '[ERROR] ' + message );
};

de.Log.prototype.warn = function( message ) {
    this._log( process.stderr, '[WARN] ' + message );
};

de.Log.prototype.info = function( message ) {
    this._log( process.stdout, message );
};

de.Log.prototype.debug = function( message ) {
    if ( this._debug ) {
        this._log( process.stdout, '[DEBUG] ' + message );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Log.prototype._log = function( stream, message ) {
    message = this._date_formatter( new Date() ) + ' ' + message + ' [pid.' + process.pid + ']\n';

    stream.write( message );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Log.Silent = function() {
    //  Do nothing.
};

de.Log.Silent.prototype.error = no.op;
de.Log.Silent.prototype.warn = no.op;
de.Log.Silent.prototype.info = no.op;
de.Log.Silent.prototype.debug = no.op;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

