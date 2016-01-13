var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function callback_after( callback, timeout ) {
    return function() {
        var promise = no.promise();

        setTimeout( function() {
            var value = callback();
            if ( !( value instanceof de.Result.Value ) ) {
                value = new de.Result.Value( value );
            }

            promise.resolve( value );
        }, timeout );

        return promise;
    }
}

function wrap_result( callback ) {
    return function() {
        return no.promise.resolved( new de.Result.Value( callback() ) );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block.deps', function() {

    it( 'block depends on another block', function( done ) {
        var foo;

        var b1 = de.block(
            callback_after( function() {
                foo = 42;

                return 24;
            }, 50 )
        );

        var b2 = de.block(
            wrap_result( function() {
                return foo;
            } ),
            {
                deps: b1
            }
        );

        de.array( [ b1, b2 ] )
            .run()
            .then( function( result ) {
                expect( result.as_object() ).to.be.eql( [ 24, 42 ] );

                done();
            } );
    } );

    it( 'block depends on another block (array)', function( done ) {
        var foo;

        var b1 = de.block(
            callback_after( function() {
                foo = 42;

                return 24;
            }, 50 )
        );

        var b2 = de.block(
            wrap_result( function() {
                return foo;
            } ),
            {
                deps: [ b1 ]
            }
        );

        de.array( [ b1, b2 ] )
            .run()
            .then( function( result ) {
                expect( result.as_object() ).to.be.eql( [ 24, 42 ] );

                done();
            } );
    } );

    it( 'block depends on another block by id', function( done ) {
        var foo;

        var b1 = de.block(
            callback_after( function() {
                foo = 42;

                return 24;
            }, 50 ),
            {
                id: 'b1'
            }
        );

        var b2 = de.block(
            wrap_result( function() {
                return foo;
            } ),
            {
                deps: 'b1'
            }
        );

        de.array( [ b1, b2 ] )
            .run()
            .then( function( result ) {
                expect( result.as_object() ).to.be.eql( [ 24, 42 ] );

                done();
            } );
    } );

    it( 'block depends on another block by id (array)', function( done ) {
        var foo;

        var b1 = de.block(
            callback_after( function() {
                foo = 42;

                return 24;
            }, 50 ),
            {
                id: 'b1'
            }
        );

        var b2 = de.block(
            wrap_result( function() {
                return foo;
            } ),
            {
                deps: [ 'b1' ]
            }
        );

        de.array( [ b1, b2 ] )
            .run()
            .then( function( result ) {
                expect( result.as_object() ).to.be.eql( [ 24, 42 ] );

                done();
            } );
    } );

    it( 'block depends on several blocks', function( done ) {
        var values = [ 'one', 'two', 'three' ];

        var result = [];
        var blocks = values.map( function( value, i ) {
            return de.block(
                callback_after( function() {
                    result[ i ] = value;
                }, 50 ),
                {
                    id: value
                }
            );
        } );

        var block = de.block(
            wrap_result( function() {
                return result;
            } ),
            {
                id: 'block',
                deps: blocks
            }
        );

        de.object( {
            foo: de.array( blocks, { id: 'blocks' } ),
            bar: block
        }, { id: 'test' } )
            .run()
            .then( function( result ) {
                expect( result.as_object().bar ).to.be.eql( values );

                done();
            } );
    } );

} );

