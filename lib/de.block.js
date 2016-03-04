var fs_ = require( 'fs' );
var path_ = require( 'path' );

var no = require( 'nommon' );

var de = require( './de.js' );
require( './de.error.js' );
require( './de.request.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _require_cache = {};

de.require = function( filename ) {
    if ( !path_.isAbsolute( filename ) ) {
        //  FIXME.
        throw 'Error';
    }

    //  FIXME: Не нужно ли как-то по-другому нормализовать filename?
    filename = path_.resolve( filename );

    var cached = _require_cache[ filename ];
    if ( cached ) {
        return cached;
    }

    var dirname = path_.dirname( filename );

    var block = require( filename );
    if ( block instanceof Lazy ) {
        block = block._clone();

        //  FIXME: А как-то более цивильно это можно сделать?
        block.options.push( { dirname: dirname } );

    } else {
        block = de( block, { dirname: dirname } );
    }

    _require_cache[ filename ] = block;

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

var _dir_options_cache = {};

function load_dir_options( dirname ) {
    var options = _dir_options_cache[ dirname ];

    if ( options === undefined ) {
        try {
            options = require( path_.join( dirname, '.descript.js' ) );

        } catch ( e ) {
            options = null;
        }

        _dir_options_cache[ dirname ] = options;
    }

    return options;
}

//  ---------------------------------------------------------------------------------------------------------------  //

var _block_id = 0;

function generate_id() {
    return 'block-' + _block_id++;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function Block( block, options ) {
    this._init( block, options );
}

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype._init = function( block, options ) {
    this._init_options( options );
    this._init_block( block );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype._init_options = function( options ) {
    this.options = {};

    if ( options ) {
        var dirname;
        for ( var i = options.length - 1; i >= 0; i-- ) {
            dirname = options[ i ].dirname;
            if ( dirname ) {
                break;
            }
        }

        if ( dirname ) {
            this.dirname = dirname;

            var dir_options = load_dir_options( dirname );

            if ( dir_options ) {
                options.unshift( dir_options );
            }
        }

        for ( var i = 0, l = options.length; i < l; i++ ) {
            this.options = extend_options( this.options, options[ i ] );
        }

        this.options.deps = compile_deps( this.options.deps );
        this.options.guard = compile_option( this.options.guard, compile_expr );
        this.options.result = compile_option( this.options.result, compile_result );
        this.options.key = compile_string( this.options.key );
        this.options.transform = compile_option( this.options.transform, compile_transform );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

function extend_options( what, by ) {
    var options = {};

    options.name = by.name || what.name;

    options.deps = extend_option( what.deps, by.deps );

    options.valid_params = extend_valid_params( what.valid_params, by.valid_params );
    //  FIXME: Тут что-то более сложное должно быть.
    options.params = extend_option( what.params, by.params );

    options.guard = extend_option( what.guard, by.guard );

    options.before = extend_option( by.before, what.before );
    options.after = extend_option( what.after, by.after );

    options.select = extend_option( what.select, by.select );
    options.result = extend_option( what.result, by.result );

    options.timeout = by.timeout || what.timeout;

    options.key = by.key || what.key;
    options.maxage = by.maxage || what.maxage;

    options.transform = extend_option( what.transform, by.transform );

    return options;
}

function extend_option( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    return [].concat( what, by );
}

function extend_valid_params( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    var params = no.extend( {}, what );

    for ( var p_name in by ) {
        var p_value = by[ p_name ];

        if ( p_value != null ) {
            params[ p_name ] = p_value;

        } else if ( params[ p_name ] === undefined ) {
            params[ p_name ] = null;

        }
    }

    return params;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_deps( deps ) {
    if ( deps == null ) {
        return null;
    }

    deps = no.array( deps );

    return deps.map( function( dep ) {
        if ( dep instanceof Block || dep instanceof Lazy ) {
            return {
                id: dep.get_id()
            };
        }

        if ( typeof dep === 'string' ) {
            return {
                id: dep
            };
        }

        if ( dep.block ) {
            if ( typeof dep.block === 'string' ) {
                dep.id = dep.block;

            } else {
                dep.id = dep.block.get_id();
            }
        }

        return dep;
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_option( option, compiler ) {
    if ( option == null ) {
        return null;
    }

    //  FIXME: Убрать map.
    return ( Array.isArray( option ) ) ? option.map( compiler ) : compiler( option );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_expr( expr ) {
    if ( expr == null ) {
        return null;
    }

    return ( typeof expr === 'function' ) ? expr : no.jpath.expr( expr );
}

function compile_string( expr ) {
    if ( expr == null ) {
        return null;
    }

    return ( typeof expr === 'function' ) ? expr : no.jpath.string( expr );
}

function compile_result( expr ) {
    if ( expr == null ) {
        return expr;
    }

    if ( typeof expr === 'function' ) {
        return expr;
    }

    if ( Array.isArray( expr ) ) {
        var l = expr.length;
        var compiled = [];
        for ( var i = 0; i < l; i++ ) {
            compiled.push( compile_result( expr[ i ] ) );
        }

        return function( params, context, state, result ) {
            var r = [];
            for ( var i = 0; i < l; i++ ) {
                r.push( compiled[ i ]( params, context, state, result ) );
            }
            return r;
        };
    }

    if ( typeof expr === 'object' ) {
        var compiled = {};
        for ( var name in expr ) {
            compiled[ name ] = compile_result( expr[ name ] );
        }

        return function( params, context, state, result ) {
            var r = {};
            for ( var name in compiled ) {
                r[ name ] = compiled[ name ]( params, context, state, result );
            }
            return r;
        };
    }

    return function( params, context, state, result ) {
        return expr;
    };
}

function compile_select( object ) {
    if ( object == null ) {
        return null;
    }

    var compiled = {};
    for ( var name in object ) {
        compiled[ name ] = de.jexpr( object[ name ] );
    }
    return compiled;
}

function compile_transform( transform ) {
    if ( transform == null ) {
        return null;
    }

    //  FIXME.
    return function() {
        return '<h1>Hello</h1>'
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype.get_id = function() {
    return this.id;
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Убрать в Block.File.
Block.prototype.resolve_filename = function( filename ) {
    return path_.resolve( this.dirname, filename );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype._params = function( params, context, state ) {
    var o_params = this.options.params;

    //  Если в `this.options.params` функция, то берем ее результат
    //  без каких-либо дополнительных проверок и фильтров.
    //
    if ( typeof o_params === 'function' ) {
        return o_params( params, context, state );
    }

    var o_valid_params = this.options.valid_params;

    var new_params;
    if ( o_valid_params ) {
        new_params = {};

        //  Выбираем из `params` только те ключи, которые присутствуют в `this.options.valid_params`.
        //
        for ( var p_name in o_valid_params ) {
            var p_value = params[ p_name ];
            if ( p_value == null ) {
                //  В `this.options.valid_params` может быть задано дефолтное значение параметра.
                p_value = o_valid_params[ p_name ];
            }

            if ( p_value != null ) {
                new_params[ p_name ] = p_value;
            }
        }

    } else {
        new_params = no.extend( {}, params );
    }

    //  `this.options.params` позволяют перекрыть переданные/дефолтные значения параметров.
    //
    for ( var p_name in o_params ) {
        var p_value = o_params[ p_name ];

        //  FIXME: Не нужно, кажется, ничего удалять. Плохая идея.
        if ( p_value == null ) {
            delete new_params[ p_name ];

        } else {
            new_params[ p_name ] = ( typeof p_value === 'function' ) ? p_value( params, context, state ) : p_value;
        }
    }

    return new_params;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype._do_phase_before = function *( params, context, state ) {
    var error;

    var deps = this.options.deps;
    if ( deps ) {
        var promises = [];
        for ( var i = 0, l = deps.length; i < l; i++ ) {
            promises.push( context._get_promise( deps[ i ].id ) );
        }

        context._dependent_blocks[ this.get_id() ] = true;
        context._queue_deps_check();

        error = yield no.promise.maybe( promises )
            .then( function( result ) {
                if ( de.is_error( result ) ) {
                    return de.error( 'DEPS_ERROR' );

                } else {
                    for ( var i = 0, l = deps.length; i < l; i++ ) {
                        var dep = deps[ i ];
                        var dep_state = context._states[ dep.id ];
                        merge_states( state, dep_state );

                        if ( dep.select ) {
                            do_select( dep.select, params, context, state, result[ i ] );
                        }
                    }

                }
            } );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var options_guard = this.options.guard;
    if ( options_guard ) {
        if ( Array.isArray( options_guard ) ) {
            for ( var i = 0, l = options_guard.length; i < l; i++ ) {
                if ( !options_guard[ i ]( params, context, state ) ) {
                    return yield *this._do_phase_error( params, context, state, de.error( 'BLOCK_GUARDED' ) );
                }
            }

        } else {
            if ( !options_guard( params, context, state ) ) {
                return yield *this._do_phase_error( params, context, state, de.error( 'BLOCK_GUARDED' ) );
            }
        }
    }

    //  FIXME: Кажется, что сейчас блок может вызвать start_in_context,
    //  но не успеть вызвать done_in_context, если произошла какая-то ошибка.
    //  Кажется, это не очень хорошо. Нужны тесты с несколькими блоками.
    //
    this._start_in_context( context );

    if ( this.options.before ) {
        error = yield *run_callbacks_chain( this.options.before, params, context, state );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var progress;

    var key;
    if ( context.cache && this.options.key ) {
        key = this.options.key( params, context, state );
        if ( key ) {
            progress = yield context.cache.get( key );

            if ( progress !== undefined ) {
                return yield *this._do_phase_after( params, context, state, progress );
            }
        }
    }

    var that = this;

    //  FIXME.
    //  По каким параметрам нужно вычислять ключ?
    //  По новым или по старым?
    params = this._params( params, context, state ) || params;

    //  FIXME: Тут был код для кэширования запроса к action, если есть key.
    //  Т.е. если сразу несколько запросов запросили ресурс, которого нет в кэше,
    //  то нет смысла делать несколько запросов.

    var running = this._action( params, context, state );

    if ( this.options.timeout > 0 ) {
        var h_timeout = setTimeout(
            function() {
                var error = de.error( 'BLOCK_TIMED_OUT' );
                running.resolve( error );
                running.trigger( 'abort', error );

                h_timeout = null;
            },
            this.options.timeout
        );

        running.then( function() {
            if ( h_timeout ) {
                clearTimeout( h_timeout );
                h_timeout = null;
            }
        } );
    }

    var progress = yield running;

    this._done_in_context( context );

    if ( de.is_error( progress ) ) {
        return yield *this._do_phase_error( params, context, state, progress );
    }

    if ( context.cache && progress !== undefined && key ) {
        //  FIXME: Вычислять maxage.
        yield context.cache.set( key, progress, this.options.maxage );
    }

    return yield *this._do_phase_after( params, context, state, progress );
};

Block.prototype._do_phase_after = function *( params, context, state, progress ) {
    //  console.log( 'phase.after', this.get_id(), this._type, progress );
    var error;

    if ( this.options.select ) {
        do_select( this.options.select, params, context, state, progress );
    }

    if ( this.options.after ) {
        error = yield *run_callbacks_chain( this.options.after, params, context, state, progress );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var options_result = this.options.result;
    if ( options_result ) {
        if ( Array.isArray( options_result ) ) {
            for ( var i = 0, l = options_result.length; i < l; i++ ) {
                progress = options_result[ i ]( params, context, state, progress );
                if ( progress === undefined ) {
                    break;
                }
            }

        } else {
            progress = this.options.result( params, context, state, progress );
        }
    }
    //  FIXME: Что если тут progress стал undefined?

    if ( this.options.template ) {
        //  FIXME: Не терять params, context, state.
        progress = yield this.options.template( progress );
    }

    return progress;
};

Block.prototype._do_phase_error = function *( params, context, state, error ) {
    //  FIXME: А что тут еще делать?
    //  А не вызвыать ли тут done_in_context?
    return error;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function do_select( select, params, context, state, result ) {
    for ( var name in select ) {
        var value = select[ name ]( params, context, state, result );
        if ( value === undefined ) {
            continue;
        }

        var old_value = state[ name ];
        if ( Array.isArray( old_value ) ) {
            if ( old_value !== value ) {
                state[ name ] = old_value.concat( value );
            }

        } else {
            state[ name ] = value;
        }
    }
}

function merge_states( left, right ) {
    for ( var name in right ) {
        var r_value = right[ name ];
        if ( r_value === undefined ) {
            continue;
        }

        var l_value = left[ name ];
        if ( Array.isArray( l_value ) ) {
            if ( l_value !== r_value ) {
                left[ name ] = l_value.concat( r_value );
            }

        } else {
            left[ name ] = r_value;
        }
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

function *run_callbacks_chain( callbacks, params, context, state, progress ) {
    if ( Array.isArray( callbacks ) ) {
        for ( var i = 0, l = callbacks.length; i < l; i++ ) {
            var error = yield callbacks[ i ]( params, context, state, progress );

            if ( de.is_error( error ) ) {
                return error;
            }
        }

    } else {
        var error = yield callbacks( params, context, state, progress );

        if ( de.is_error( error ) ) {
            return error;
        }
    }
}

function async_iterate( it, context ) {
    return new Promise( function( resolve ) {
        ( function run( value ) {
            if ( context._done ) {
                return resolve( context._done );
            }

            //  FIXME: Тут нужна настройка в конфиге.
            //  В dev-окружении не нужно делать try/catch.
            //  А в prod'е, конечно, лучше бы не падать на любой чих.
            //
            //  Но если убрать этот try/catch, то тестовая среда ловит эксепшены
            //  и прячет их.
            //
            try {
                var ret = it.next( value );
            } catch ( e ) {
                console.log( 'CATCH', e, e.stack );
                return resolve( de.error( e ) );
            }

            if ( context._done ) {
                return resolve( context._done );
            }

            value = ret.value;
            if ( !ret.done ) {
                if ( no.is_promise( value ) ) {
                    value.then( run );

                } else {
                    setImmediate( run, value );
                }

            } else {
                resolve( value );
            }
        } )();
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype._run = function( params, context ) {
    //  FIXME: Нужно где-то проверить, что блок с этим id уже запущен в этом контексте.
    //  И что тогда делать? Если зарезолвить финальный промис ошибкой, то несколько блоков зааффектятся.
    //  Можно ничего не делать? Вернуть promise и все.

    context._n_blocks++;

    var id = this.get_id();
    //  FIXME: Нужно пробрасывать abort из итогового промиса в running из phases.action.
    var promise = context._get_promise( id );
    var state = context._states[ id ] = {};

    async_iterate( this._do_phase_before( params, context, state ), context )
        .then( function( result ) {
            promise.resolve( result );
        } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.prototype._start_in_context = function( context ) {
    context._n_active_blocks++;
};

Block.prototype._done_in_context = function( context ) {
    context._n_blocks--;
    context._n_active_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Нужно пробрасывать сюда dirname?
//  Если блок это подблок в Block.Array или Block.Object, у которых выставлен dirname.
//
function compile_block( block ) {
    //  FIXME: Убрать потом.
    if ( arguments.length === 2 ) {
        throw Error( 'Something wrong' );
    }

    if ( block instanceof Block ) {
        return block;

    } else if ( block instanceof Lazy ) {
        return block._compile();

    } else if ( Array.isArray( block ) ) {
        return new Block.Array( block );

    } else if ( block && typeof block === 'object' ) {
        return new Block.Object( block );

    } else if ( typeof block === 'function' ) {
        return new Block.Function( block );

    /*
    } if ( no.is_runable( block ) ) {
        return block;
    */

    } else {
        return new Block.Value( block );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

function Lazy( ctor, block, options ) {
    return factory( ctor, block, options );
}

Lazy.prototype = Object.create( Function.prototype );

//  ---------------------------------------------------------------------------------------------------------------  //

function factory( ctor, block, options ) {
    var f = function( new_block, new_options ) {
        f = f._clone();

        if ( arguments.length === 1 ) {
            new_options = new_block;
            new_block = null;
        }

        if ( new_block ) {
            if ( ctor._extend_block && ( typeof new_block === 'object' ) && !Array.isArray( new_block ) ) {
                f.block = ctor._extend_block( f.block, new_block );

            } else {
                f.block = new_block;
            }
        }

        if ( new_options ) {
            f.options.push( new_options );

            f.id = new_options.id;
        }

        f.id = f.id || generate_id();

        return f;
    };

    f.__proto__ = Lazy.prototype;
    f._init( ctor, block, options );

    return f;
}

//  ---------------------------------------------------------------------------------------------------------------  //

Lazy.prototype._init = function( ctor, block, options ) {
    this.ctor = ctor;

    this.block = block;

    if ( options ) {
        if ( Array.isArray( options ) ) {
            this.options = [].concat( options );

        } else {
            this.options = [ options ];

            this.id = options.id;
        }

    } else {
        this.options = [];
    }

    this.id = this.id || generate_id();
};

//  ---------------------------------------------------------------------------------------------------------------  //

Lazy.prototype._clone = function() {
    return factory( this.ctor, this.block, this.options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Lazy.prototype.get_id = function() {
    return this.id;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Lazy.prototype._run = function( params, context ) {
    var compiled = this._compile();

    return context.run( compiled, params );
};

Lazy.prototype._compile = function() {
    var compiled = this._compiled;

    if ( !compiled ) {
        compiled = this._compiled = new this.ctor( this.block, this.options );

        compiled.id = this.id;
    }

    return compiled;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Http = function( block, options ) {
    this._init( block, options );
};

no.inherit( Block.Http, Block );

Block.Http.prototype._type = 'http';

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Http.prototype._init_block = function( raw_block ) {
    if ( typeof raw_block === 'function' ) {
        this.block = raw_block;

    } else {
        if ( typeof raw_block === 'string' ) {
            this.block = {
                url: raw_block
            };

        } else {
            this.block = no.extend( {}, raw_block );
        }

        this.block.url = compile_string( this.block.url );
        this.block.path = compile_string( this.block.path );
        this.block.hostname = compile_string( this.block.hostname );
        this.block.host = compile_string( this.block.host );

        this.block.headers = compile_object( this.block.headers );

        this.block.query = compile_object( this.block.query );
        this.block.body = compile_object( this.block.body );
    }
};

function compile_string( str ) {
    if ( str == null ) {
        return null;
    }

    return ( typeof str === 'function' ) ? str : no.jpath.string( str );
}

function compile_object( obj ) {
    if ( obj == null ) {
        return null;
    }

    if ( typeof obj === 'function' ) {
        return obj;
    }

    var js = 'var r={};';
    for ( var name in obj ) {
        var value = obj[ name ];

        var prop_name = JSON.stringify( name );

        js += 'r[' + prop_name + ']=';
        switch ( typeof value ) {
            case 'function':
                js += 'o[' + prop_name + '](p,c);';
                break;

            case 'string':
            case 'number':
            case 'boolean':
                js += JSON.stringify( value ) + ';';
                break;

            default:
                js += 'o[' + prop_name + '];';
        }
    }
    js += 'return r';

    var compiled = Function( 'o', 'p', 'c', js );

    return function( params, context ) {
        return compiled( obj, params, context );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Http.prototype._action = function( params, context, state ) {
    var options;

    var block = this.block;

    if ( typeof block === 'function' ) {
        options = block( params, context, state );

    } else {
        options = {};

        if ( block.url ) {
            //  FIXME: jvars
            options.url = block.url( params, context );
        }
        if ( block.protocol ) {
            options.protocol = block.protocol;
        }
        if ( block.hostname ) {
            //  FIXME: jvars
            options.hostname = block.hostname( params, context );
        }
        if ( block.host ) {
            //  FIXME: jvars
            options.host = block.host( params, context );
        }
        if ( block.port ) {
            options.port = block.port;
        }
        if ( block.path ) {
            //  FIXME: jvars
            options.path = block.path( params, context );
        }
        options.method = block.method || 'GET';
        if ( block.headers ) {
            //  FIXME: jvars
            options.headers = block.headers( params, context );
        }

        if ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) {
            if ( block.query ) {
                //  FIXME: jvars
                options.query = block.query( params, context );
            }
            //  FIXME: jvars
            options.body = ( block.body ) ? block.body( params, context ) : params;

        } else {
            //  FIXME: jvars
            options.query = ( block.query ) ? block.query( params, context ) : params;
        }

        options.max_redirects = block.max_redirects || 0;
        options.max_retries = block.max_retries || 0;
        if ( block.is_retry_allowed ) {
            options.is_retry_allowed = block.is_retry_allowed;
        }
    }

    var running = no.promise();

    de.request( options, context )
        .then(
            function( result ) {
                if ( no.is_error( result ) ) {
                    return running.resolve( de.error( result.error ) );
                }

                if ( block.only_meta ) {
                    return running.resolve( {
                        status_code: result.status_code,
                        headers: result.headers
                    } );
                }

                var is_json = block.is_json || ( result.headers[ 'content-type' ] === 'application/json' );
                var body;
                if ( !result.body ) {
                    body = null;

                } else {
                    if ( is_json ) {
                        try {
                            body = JSON.parse( result.body.toString() );

                        } catch ( e ) {
                            return running.resolve( de.error( e, 'INVALID_JSON' ) );
                        }

                    } else {
                        body = result.body.toString();
                    }
                }

                running.resolve( body );
            },

            function( error ) {
                running.resolve( de.error( error ) );
            }
        );

    return running;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.File = function( block, options ) {
    this._init( block, options );
};

no.inherit( Block.File, Block );

Block.File.prototype._type = 'file';

//  ---------------------------------------------------------------------------------------------------------------  //

Block.File.prototype._init_block = function( raw_block ) {
    this.block = {};

    this.block.filename = no.jpath.string( raw_block.filename );
    this.block.is_json = raw_block.is_json || null;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.File.prototype._action = function( params, context, state ) {
    //  FIXME: Поправить jvars.
    var filename = this.resolve_filename( this.block.filename( params, context ) );

    var is_json = this.block.is_json || ( path_.extname( filename ) === '.json' );

    var promise = no.promise();

    fs_.readFile( filename, function( error, result ) {
        if ( error ) {
            promise.resolve( de.error( error ) );

        } else {
            if ( is_json ) {
                try {
                    result = JSON.parse( result );

                    promise.resolve( result );

                } catch ( e ) {
                    promise.resolve( de.error( e, 'INVALID_JSON' ) );
                }

            } else {
                promise.resolve( result.toString() );
            }
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Value = function( block, options ) {
    this._init( block, options );
};

no.inherit( Block.Value, Block );

Block.Value.prototype._type = 'value';

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Value.prototype._init_block = function( raw_block ) {
    this.block = raw_block;
};

Block.Value.prototype._action = function( params, context, state ) {
    return no.promise.resolved( this.block );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Function;

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Array = function( block, options ) {
    this._init( block, options );
};

no.inherit( Block.Array, Block );

Block.Array.prototype._type = 'array';

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Array.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    this.block = [];
    for ( var i = 0, l = raw_block.length; i < l; i++ ) {
        var block = compile_block( raw_block[ i ] );
        block.dirname = dirname;

        this.block.push( block );
    }
};

Block.Array.prototype._action = function( params, context, state ) {
    var promises = [];

    var block = this.block;
    for ( var i = 0, l = block.length; i < l; i++ ) {
        promises.push( this.block[ i ]._run( params, context, state ) );
    }

    var promise = no.promise.all( promises );

    promise.on( 'abort', function( reason ) {
        for ( var i = 0, l = promises.length; i < l; i++ ) {
            promises[ i ].trigger( 'abort', reason );
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Array.prototype._start_in_context = function( context ) {
    //  Do nothing.
};

Block.Array.prototype._done_in_context = function( context ) {
    context._n_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Object = function( block, options ) {
    this._init( block, options );
};

no.inherit( Block.Object, Block );

Block.Object.prototype._type = 'object';

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Object.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    this.block = [];
    this.keys = [];
    for ( var key in raw_block ) {
        this.keys.push( key );

        var block = compile_block( raw_block[ key ] );
        block.dirname = dirname;

        this.block.push( block );
    }
};

Block.Object.prototype._action = function( params, context, state ) {
    //  console.log( '_action', this.id, this._type );

    var promises = {};

    for ( var i = 0, l = this.block.length; i < l; i++ ) {
        promises[ this.keys[ i ] ] = this.block[ i ]._run( params, context, state );

        /*
        var id = block.id;
        var ids = context._required_as_subblock_by[ id ] || (( context._required_as_subblock_by[ id ] = {} ));
        ids[ id ] = true;
        */
    }
    //context._waiting_for_n_subblocks[ this.id ] = l;

    //  FIXME: Прокидывать abort.

    return no.promise.all( promises );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Object.prototype._start_in_context = Block.Array.prototype._start_in_context;
Block.Object.prototype._done_in_context = Block.Array.prototype._done_in_context;

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Function = function( block, options ) {
    this._init( block, options );
};

no.inherit( Block.Function, Block );

Block.Function.prototype._type = 'function';

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Function.prototype._init_block = function( raw_block ) {
    this.block = raw_block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Block.Function.prototype._action = function( params, context, state ) {
    var r;
    try {
        r = this.block( params, context, state );

    } catch ( e ) {
        return no.promise.resolved( de.error( e ) );
    }

    if ( no.is_promise( r ) ) {
        return r;
    }

    if ( r instanceof Lazy ) {
        return r._run( params, context, state );
    }

    return no.promise.resolved( r );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function block_factory( ctor ) {
    return function( block, options ) {
        return factory( ctor, block, options );
    };
}

de.http = block_factory( Block.Http );
de.file = block_factory( Block.File );
de.value = block_factory( Block.Value );
de.func = block_factory( Block.Function );
de.array = block_factory( Block.Array );
de.object = block_factory( Block.Object );

de.block = function( block, options ) {
    if ( block instanceof Block ) {
        return block;
    }

    if ( block instanceof Lazy ) {
        return ( options ) ? block( options ) : block;
    }

    if ( Array.isArray( block ) ) {
        return de.array( block, options );
    }

    if ( block && typeof block === 'object' ) {
        return de.object( block, options );
    }

    if ( typeof block === 'function' ) {
        return de.func( block, options );
    }

    return de.value( block, options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

