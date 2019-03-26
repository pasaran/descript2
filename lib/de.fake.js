var no = require( 'nommon' );

var http_ = require( 'http' );
var path_ = require( 'path' );
var url_ = require( 'url' );

//  var de = require( './de.error.js' );

const to_array = require( './to_array' );

//  ---------------------------------------------------------------------------------------------------------------  //

var DEFAULT_CONFIG = {
    port: 0,
    dirname: '.'
};

var Fake = function( config, routes ) {
    this.config = no.extend( {}, DEFAULT_CONFIG, config );
    if ( !path_.isAbsolute( this.config.dirname ) ) {
        this.config.dirname = path_.resolve(
            path_.dirname( require.main.filename ),
            this.config.dirname
        );
    }

    this.routes = {};
    if ( routes ) {
        this.add( routes );
    }

    var response404 = new Answer(
        {
            status_code: 404
        },
        this.config
    );

    var that = this;
    this._server = http_.createServer( function( req, res ) {
        var parsed_url = url_.parse( req.url );
        var path = parsed_url.pathname;

        var buffers = [];
        var received_length = 0;

        req.on( 'data', function( data ) {
            buffers.push( data );
            received_length += data.length;
        } );
        req.on( 'end', function() {
            var data = ( received_length ) ? Buffer.concat( buffers, received_length ) : null;

            var route = that.routes[ path ];
            if ( route ) {
                route.response( req, res, data );

            } else {
                response404.response( req, res, data );
            }
        } );
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Fake.prototype.add = function( path, route ) {
    if ( typeof path === 'object' ) {
        var routes = path;
        for ( var path in routes ) {
            this.routes[ path ] = new Route( routes[ path ], this.config );
        }

    } else {
        this.routes[ path ] = new Route( route, this.config );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

Fake.prototype.start = function( callback ) {
    this._server.listen( this.config.port, '0.0.0.0', callback );
};

Fake.prototype.stop = function( callback ) {
    this._server.close( callback );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function Route( answers, config ) {
    this.config = config;

    answers = to_array( answers );
    this.answers = [];
    for ( var i = 0, l = answers.length; i < l; i++ ) {
        this.answers.push( new Answer( answers[ i ], this.config ) );
    }

    this.current_answer = 0;
};

Route.prototype.response = function( req, res, data ) {
    var answer = this.answers[ this.current_answer ];
    answer.response( req, res, data );

    this.current_answer = ( this.current_answer + 1 ) % this.answers.length;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function Answer( answer, config ) {
    this.config = config;

    if ( typeof answer === 'function' ) {
        this.answer = answer;

    } else {
        this.answer = {};

        this.answer.status_code = answer.status_code || 200;
        this.answer.headers = answer.headers || {};

        this.answer.content = answer.content || null;

        this.answer.timeout = answer.timeout || 0;

        if ( Array.isArray( answer.stops ) ) {
            this.answer.stops = answer.stops;

        } else if ( ( answer.chunks > 0 ) && ( answer.interval > 0 ) ) {
            this.answer.stops = [];
            for ( var i = 0; i < answer.chunks; i++ ) {
                this.answer.stops[ i ] = i * answer.interval;
            }

        } else {
            this.answer.wait = answer.wait || 0;
        }
    }
};

Answer.prototype.response = function( req, res, data ) {
    var answer = this.answer;

    if ( typeof answer === 'function' ) {
        return answer( req, res, data );
    }

    var content = ( typeof answer.content === 'function' ) ? answer.content( req, res, data ) : answer.content;
    if ( !no.is_promise( content ) ) {
        content = no.promise.resolved( content );
    }

    content.then( function( content ) {
        if ( answer.timeout > 0 ) {
            setTimeout( function() {
                res.socket.destroy();
            }, answer.timeout );
        }

        res.statusCode = answer.status_code;
        for ( var header_name in answer.headers ) {
            res.setHeader( header_name, answer.headers[ header_name ] );
        }

        if ( !content ) {
            if ( answer.wait > 0 ) {
                setTimeout( function() {
                    res.end();
                }, answer.wait );

            } else {
                res.end();
            }

            return;
        }

        /*
        if ( de.is_error( content ) ) {
            content = content.error;
            res.statusCode = content.status_code || 500;
        }
        */

        if ( typeof content === 'object' ) {
            content = JSON.stringify( content );
            set_content_type( 'application/json' );

        } else {
            content = String( content );
            set_content_type( 'text/plain' );
        }

        res.setHeader( 'content-length', content.length );

        if ( answer.wait === 0 ) {
            return res.end( content );

        } else if ( answer.wait > 0 ) {
            return setTimeout( function() {
                res.end( content );
            }, answer.wait );
        }

        var l = answer.stops.length;

        var chunk_length = Math.floor( ( content.length - 1 ) / l ) + 1;

        for ( var i = 0; i < l; i++ ) {
            ( function( i, interval ) {
                setTimeout( function() {
                    res.write( content.substr( i * chunk_length, chunk_length ) );

                    if ( i === l - 1 ) {
                        res.end();
                    }
                }, interval );
            } )( i, answer.stops[ i ] );
        }
    } );

    function set_content_type( content_type ) {
        if ( !res.getHeader( 'content-type' ) ) {
            res.setHeader( 'content-type', content_type );
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Fake;

