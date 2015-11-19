var http_ = require( 'http' );
var fs_ = require( 'fs' );
var path_ = require( 'path' );
var url_ = require( 'url' );

//  ---------------------------------------------------------------------------------------------------------------  //

var Fake = function( routes, config ) {
    this.config = config || {};
    var dirname = path_.dirname( require.main.filename );
    this.config.dirname = path_.resolve( dirname, this.config.dirname || '.' );

    this.routes = {};
    for ( var path in routes ) {
        this.routes[ path ] = new Fake.Route( routes[ path ], this.config );
    }

    var response404 = new Fake.Answer( {
        status_code: 404
    } );

    var that = this;
    this._server = http_.createServer( function( req, res ) {
        var parsed_url = url_.parse( req.url );
        var path = parsed_url.path;

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

Fake.prototype.listen = function( port, hostname, callback ) {
    if ( !this._running ) {
        this._server.listen( port, hostname, callback );

        this._running = true;
    }
};

Fake.prototype.close = function( callback ) {
    if ( this._running ) {
        this._server.close( callback );

        this._running = false;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

Fake.Route = function( answers, config ) {
    this.config = config;

    answers = ( Array.isArray( answers ) ) ? answers : [ answers ];
    this.answers = [];
    for ( var i = 0, l = answers.length; i < l; i++ ) {
        this.answers.push( new Fake.Answer( answers[ i ], config ) );
    }
    this.current_answer = 0;
};

Fake.Route.prototype.response = function( req, res, data ) {
    var answer = this.answers[ this.current_answer ];
    answer.response( req, res, data );

    this.current_answer = ( this.current_answer + 1 ) % this.answers.length;
};

//  ---------------------------------------------------------------------------------------------------------------  //

var EXT_TO_CONTENT_TYPE = {
    '.json': 'application/json',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.text': 'text/plain',
    '.txt': 'text/plain',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.xml': 'text/xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
};

Fake.Answer = function( answer, config ) {
    this.config = config;

    if ( typeof answer === 'function' ) {
        this.answer = answer;

    } else {
        this.answer = {};

        this.answer.status_code = answer.status_code || 200;
        this.answer.headers = answer.headers || {};

        this.answer.content = answer.content || null;
        this.answer.file = answer.file || null;

        //  this.answer.close_after = answer.close_after || 0;

        if ( Array.isArray( answer.stops ) ) {
            this.answer.stops = answer.stops;

        } else if ( answer.chunks && answer.interval ) {
            this.answer.stops = [];
            for ( var i = 0; i < answer.chunks + 1; i++ ) {
                this.answer.stops[ i ] = i * answer.interval;
            }

        } else if ( answer.wait ) {
            this.answer.wait = answer.wait;
            this.answer.stops = [ answer.wait ];

        } else {
            this.answer.stops = [ 0 ];
        }
    }
};

Fake.Answer.prototype.response = function( req, res, data ) {
    var answer = this.answer;

    if ( typeof answer === 'function' ) {
        return answer( req, res, data );
    }

    res.statusCode = answer.status_code;
    for ( var header_name in answer.headers ) {
        res.setHeader( header_name, answer.headers[ header_name ] );
    }

    if ( !answer.content && !answer.file ) {
        if ( answer.wait ) {
            setTimeout( function() {
                res.end();
            }, answer.wait );

        } else {
            res.end();
        }

        return;
    }

    var content;
    if ( answer.file ) {
        var filename = path_.resolve( this.config.dirname, answer.file );
        content = fs_.readFileSync( filename, 'utf-8' );

        set_content_type( EXT_TO_CONTENT_TYPE[ path_.extname( filename ) ] || 'application/octet-stream' );

    } else {
        if ( typeof answer.content === 'object' ) {
            content = JSON.stringify( answer.content );
            set_content_type( 'application/json' );

        } else {
            content = String( answer.content );
            set_content_type( 'text/plain' );
        }
    }

    res.setHeader( 'content-length', Buffer.byteLength( content ) );
    res.setHeader( 'transfer-encoding', 'chunked' );

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

    function set_content_type( content_type ) {
        if ( !answer.headers[ 'content-type' ] ) {
            res.setHeader( 'content-type', content_type );
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Fake;

