var de = require( './de.block.js' );

require( './de.block.custom.js' );
require( './de.block.file.js' );
require( './de.block.http.js' );
require( './de.block.value.js' );
require( './de.block.function.js' );
require( './de.block.array.js' );
require( './de.block.object.js' );

require( './de.block.lazy.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.block = de.Block.Lazy.create_factory( de.Block.Custom );
de.file = de.Block.Lazy.create_factory( de.Block.File );
de.http = de.Block.Lazy.create_factory( de.Block.Http );
de.func = de.Block.Lazy.create_factory( de.Block.Function );
de.value = de.Block.Lazy.create_factory( de.Block.Value );
de.array = de.Block.Lazy.create_factory( de.Block.Array );
de.object = de.Block.Lazy.create_factory( de.Block.Object );

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

