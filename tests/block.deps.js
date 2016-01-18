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
        var value = callback();
        if ( !( value instanceof de.Result.Value ) ) {
            value = new de.Result.Value( value );
        }

        return no.promise.resolved( value );
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

        var context = new de.Context();

        context.run( [ b1, b2 ] )
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

        var context = new de.Context();

        context.run( [ b1, b2 ] )
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

        var context = new de.Context();

        context.run( [ b1, b2 ] )
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

        var context = new de.Context();

        context.run( [ b1, b2 ] )
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
                }, 50 + 50 * i )
            );
        } );

        var block = de.block(
            wrap_result( function() {
                return result;
            } ),
            {
                deps: blocks
            }
        );

        var context = new de.Context();

        context.run( {
            foo: blocks,
            bar: block
        } )
            .then( function( result ) {
                expect( result.as_object().bar ).to.be.eql( values );

                done();
            } );
    } );

    it( 'chain of deps', function( done ) {
        var bar_value;
        var quu_value;

        var foo = de.block(
            callback_after( function() {
                bar_value = 'bar';

                return 'foo';
            }, 50 )
        );

        var bar = de.block(
            callback_after( function() {
                quu_value = 'quu';

                return bar_value;
            }, 50 ),
            {
                deps: foo
            }
        );

        var quu = de.block(
            callback_after( function() {
                return quu_value;
            }, 50 ),
            {
                deps: bar
            }
        );

        var context = new de.Context();

        context.run( [ foo, bar, quu ] )
            .then( function( result ) {
                expect( result.as_object() ).to.be.eql( [ 'foo', 'bar', 'quu' ] );

                done();
            } );
    } );

    it( 'block depends on array', function( done ) {
        var v1;
        var v2;

        var b1 = de.block(
            callback_after( function() {
                v1 = 'foo';

                return v1;
            }, 50 )
        );

        var b2 = de.block(
            callback_after( function() {
                v2 = 'bar';

                return v2;
            }, 100 )
        );

        var b3 = de.block(
            callback_after( function() {
                return [ v1, v2 ];
            }, 50 ),
            {
                deps: [ b1, b2 ]
            }
        );

        var context = new de.Context();

        context.run( [ b1, b2, b3 ] )
            .then( function( result ) {
                expect( result.as_object() ).to.be.eql( [ 'foo', 'bar', [ 'foo', 'bar' ] ] );

                done();
            } );
    } );

} );

