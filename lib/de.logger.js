var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Logger = function() {
    this._level = de.Logger.LEVEL.LOG;
};

de.Logger.LEVEL = {
    OFF: 0,
    ERROR: 1,
    WARN: 2,
    LOG: 3,
    INFO: 4,
    DEBUG: 5
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

