var expect = require( 'expect.js' );

var de = require( '../lib/blocks/de.block.js' );

describe( 'block', function() {

    describe( 'params', function() {

        it( 'no params or valid_params', function() {
            var block = new de.Block();

            var raw_params = {
                a: 42,
                b: 'hello',
                c: '',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( raw_params );
            expect( params ).not.to.be( raw_params );
        } );

        it( 'options.valid_params is an array', function() {
            var block = new de.Block( null, {
                valid_params: [ 'a', 'b' ]
            } );

            var raw_params = {
                a: 42,
                b: 'hello',
                c: '',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                a: 42,
                b: 'hello'
            } );
        } );

        it( 'options.valid_params is an object', function() {
            var block = new de.Block( null, {
                valid_params: {
                    c: null,
                    d: null
                }
            } );

            var raw_params = {
                a: 42,
                b: 'hello',
                c: '',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                c: '',
                d: 0
            } );
        } );

        it( 'options.valid_params with defaul values', function() {
            var block = new de.Block( null, {
                valid_params: {
                    a: null,
                    b: 24
                }
            } );

            var raw_params = {
                a: 42,
                c: 'hello'
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                a: 42,
                b: 24
            } );
        } );

        it( 'options.params', function() {
            var block = new de.Block( null, {
                params: {
                    a: 42,
                    b: function( params ) {
                        return params.c;
                    }
                }
            } );

            var raw_params = {
                a: 66,
                b: 24,
                c: 'hello',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                a: 42,
                b: 'hello',
                c: 'hello',
                d: 0
            } );
        } );

        it( 'options.params and options.valid_params', function() {
            var block = new de.Block( null, {
                valid_params: [ 'd' ],
                params: {
                    a: 42,
                    b: function( params ) {
                        return params.c;
                    }
                }
            } );

            var raw_params = {
                a: 66,
                b: 24,
                c: 'hello',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                a: 42,
                b: 'hello',
                d: 0
            } );
        } );

        it( 'options.params is a function', function() {
            var block = new de.Block( null, {
                params: function( params ) {
                    return {
                        a: 42,
                        b: params.b
                    };
                }
            } );

            var raw_params = {
                a: 66,
                b: 24,
                c: 'hello',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                a: 42,
                b: 24
            } );
        } );

        it( 'options.params is a function and options.valid_params', function() {
            var block = new de.Block( null, {
                valid_params: [ 'c' ],
                params: function( params ) {
                    return {
                        a: 42,
                        b: params.b
                    };
                }
            } );

            var raw_params = {
                a: 66,
                b: 24,
                c: 'hello',
                d: 0
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                a: 42,
                b: 24
            } );
        } );

        it( 'options.params with null', function() {
            var block = new de.Block( null, {
                params: {
                    a: null
                }
            } );

            var raw_params = {
                a: 66,
                b: 24
            };

            var params = block._params( raw_params );

            expect( params ).to.be.eql( {
                b: 24
            } );
        } );

    } );

} );

