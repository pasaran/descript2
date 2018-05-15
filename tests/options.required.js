/* eslint-env mocha */

const expect = require( 'expect.js' );

const de = require( '../lib/index.js' );

const helpers = require( './_helpers.js' );

const ERROR_ID = 'REQUIRED_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

function create_context() {
    return new de.Context.Base();
}

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.required', function() {

    it( 'block in object is required and failed', function( done ) {
        const b1 = create_block(
            helpers.wrap( function() {
                return de.error( {
                    id: ERROR_ID,
                } );
            }, 50 ),
            {
                required: true
            }
        );

        const b2 = create_block(
            helpers.wrap( { bar: 24 }, 50 ),
            {
            }
        );

        const context = create_context();
        context.run( {
            foo: b1,
            bar: b2,
        } )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.path ).to.be.eql( '.foo' );
                expect( result.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'block in object in object is required and failed', function( done ) {
        const block = create_block(
            helpers.wrap( function() {
                return de.error( {
                    id: ERROR_ID,
                } );
            }, 50 ),
            {
                required: true
            }
        );

        const context = create_context();
        context.run( {
            foo: {
                bar: block,
            },
        } )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.path ).to.be.eql( '.foo.bar' );
                expect( result.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.parent.error.path ).to.be.eql( '.bar' );
                expect( result.error.parent.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.parent.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'block in object in array is required and failed', function( done ) {
        const block = create_block(
            helpers.wrap( function() {
                return de.error( {
                    id: ERROR_ID,
                } );
            }, 50 ),
            {
                required: true
            }
        );

        const context = create_context();
        context.run( {
            foo: [ block ],
        } )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.path ).to.be.eql( '.foo[ 0 ]' );
                expect( result.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.parent.error.path ).to.be.eql( '[ 0 ]' );
                expect( result.error.parent.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.parent.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'block in array in object is required and failed', function( done ) {
        const block = create_block(
            helpers.wrap( function() {
                return de.error( {
                    id: ERROR_ID,
                } );
            }, 50 ),
            {
                required: true
            }
        );

        const context = create_context();
        context.run( [
            {
                foo: block,
            },
        ] )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.path ).to.be.eql( '[ 0 ].foo' );
                expect( result.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.parent.error.path ).to.be.eql( '.foo' );
                expect( result.error.parent.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.parent.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'block in array in array is required and failed', function( done ) {
        const block = create_block(
            helpers.wrap( function() {
                return de.error( {
                    id: ERROR_ID,
                } );
            }, 50 ),
            {
                required: true
            }
        );

        const context = create_context();
        context.run( [
            [ block ]
        ] )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.path ).to.be.eql( '[ 0 ][ 0 ]' );
                expect( result.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.id ).to.be.eql( de.Error.ID.REQUIRED_BLOCK_FAILED );
                expect( result.error.parent.error.path ).to.be.eql( '[ 0 ]' );
                expect( result.error.parent.error.parent ).to.be.a( de.Error );
                expect( result.error.parent.error.parent.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

} );

