var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Logger = function( level ) {
    this._level = level || de.Logger.LEVEL.LOG;
};

de.Logger.LEVEL = {
    OFF: 1,
    ERROR: 2,
    WARN: 3,
    LOG: 4,
    INFO: 5,
    DEBUG: 6
};

//  ---------------------------------------------------------------------------------------------------------------  //

var date_formatter = no.date.formatter( '%d.%m.%Y %H:%M:%S.%f' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Logger.prototype.set_level = function( level ) {
    this._level = level;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Logger.prototype.error = function( message ) {
    if ( this._level >= de.Logger.LEVEL.ERROR ) {
        this._log( process.stderr, message );
    }
};

de.Logger.prototype.warn = function( message ) {
    if ( this._level >= de.Logger.LEVEL.WARN ) {
        this._log( process.stderr, message );
    }
};

de.Logger.prototype.log = function( message ) {
    if ( this._level >= de.Logger.LEVEL.LOG ) {
        this._log( process.stdout, message );
    }
};

de.Logger.prototype.info = function( message ) {
    if ( this._level >= de.Logger.LEVEL.INFO ) {
        this._log( process.stdout, message );
    }
};

de.Logger.prototype.debug = function( message ) {
    if ( this._level >= de.Logger.LEVEL.DEBUG ) {
        this._log( process.stdout, message );
    }
};

de.Logger.prototype._log = function( stream, message ) {
    message = `[${ date_formatter( new Date() ) }] ${ message }`;

    stream.write( message + '\n' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports =de;

