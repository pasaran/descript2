var no = require( 'nommon' );

var de = require( './de.block.js' );
require( '../de.request.js' );

//  block = 'http://www.yandex.ru:80/search?text={ .text }'

//  block = {
//
//      protocol: 'http:',
//      host: 'www.yandex.ru',
//      //  hostname: 'www.yandex.ru',
//      port: 80,
//      path: '/search',
//      method: 'GET',
//      query: {
//          text: de.jexpr( '.text' )
//      },
//
//  }
//
//  de.http( {
//      host: config.api.http.host,
//      path: '/front/{ config.api.version }/get/sale',
//      query: {
//          sale_id: de.jexpr( '.id' ),
//          category_id: 15
//      }
//  } )
//
de.Block.Http = function( block, options ) {
    var http_options = {};
    if ( block.url ) {
        var parsed_url = url_.parse( block.url, true );

    }


    this._init_options( options );
};

