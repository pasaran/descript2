var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _id = 0;

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context = function( req, res ) {
    this.req = req;
    this.res = res;

    this.id = _id++;
};

de.Context.prototype.logger = function( message ) {
    console.log( message );
};

//  ---------------------------------------------------------------------------------------------------------------  //

var _timers = {};

de.Context.prototype.timer_start = function( id ) {
    _timers[ id ] = Date.now();
};

de.Context.prototype.timer_end = function( id ) {
    var start = _timers[ id ];
    var end = Date.now();

    return end - start;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.log = function( message ) {
    this.logger( message, 'log' );
};

de.Context.prototype.warn = function( message ) {
    this.logger( message, 'warn' );
};




//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.redirect = function( url, status_code ) {


};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.set_cookie = function( options ) {

};

