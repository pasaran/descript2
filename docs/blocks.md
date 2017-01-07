# Блоки

Блок — объект, описывающий получение данных откуда-либо.
Например, это может быть http-запрос к определенному урлу, или же чтение из файла.
Или же какое-то более сложное действие, комбинация данных из нескольких источников,
пре-, пост-обработка данных и т.д.

Блок — это stateless сущность, создается один раз (обычно) на все время жизни приложения
и может быть запущен много раз (в том числе и одновременно) с разными параметрами
и в разных контекстах.


## Определение блока

У блока есть тип (`http`, `file`, `value`, ...) и набор параметров.
Параметры бьются на две группы:

  * параметры специфичные для конкретно этого типа блока
    (например, для `http`-блока это может быть `url`).

  * параметры общие для всех блоков (параметры связанные с последовательностью выполнения,
    пост-обработкой результата, параметрами вызова и т.д.).

В общем виде определение блока выглядит как-то так:

    const block = de.block(
        {
            //  block specific options
        },
        {
            //  general options
        }
    );

где в `de.block` вместо `block` будет `http`, `file`, ...


## Запуск блока

Блок запускается в [контексте](./context.md):

    const context = new de.Context( req, res, config );

    context.run( block, params )
        .then( function( result ) {
            if ( de.is_error( result ) ) {
                //  Error.

            } else {
                console.log( result );
            }
        } );


## Типы блоков

На данный момент есть такие блоки:

  * `http` — http-запрос
  * `file` — чтение файла
  * `value` — произвольное константное js-значение
  * `object`, `array` — блоки, составленные из других блоков в виде объекта или массива
  * `func` — кастомный блок

### `http`

Куда именно делается запрос задается либо параметром `url`,
либо комбинацией параметров `method`, `protocol`, `host`, `port`, `path`:

    const block = de.http( {
        url: 'https://api.some.host.com:33333/v1/get/foo/'
    } );

    const block = de.http( {
        method: 'GET',
        protocol: 'https:',
        host: 'api.some.host.com',
        port: 33333,
        path: '/v1/get/foo/'
    } );

GET-параметры можно задать явно в `url` или `path`, например:

    const block = de.http( {
        url: 'https://api.some.host.com:33333/v1/get/foo/?id=42'
    } );

    const block = de.http( {
        ...
        path: '/v1/get/foo/?id=42'
    } );

но проще задать их в `params` при запуске блока:

    const block = de.http( {
        url: 'https://api.some.host.com:33333/v1/get/foo/'
    } );
    context.run( block, { id: 42 } )

По-дефолту для GET-запросов все `params` уходят в url, а для POST-запросов (а так же PATCH, PUT) —
в тело запроса. Это поведение можно изменить через параметры `query` и `body`:

    const block = de.http( {
        method: 'POST',
        protocol: 'https:',
        host: 'api.some.host.com',
        port: 33333,
        path: '/v1/get/foo/',
        query: {
            id: de.jexpr( 'params.id' )
        },
        body: de.jexpr( 'params.content' )
    } );

    context.run( block, {
        id: 42,
        content: 'Hello'
    } )

В этом случае будет POST-запрос на урл `/v1/get/foo/?id=42` с телом запроса `'Hello'`.

Еще можно задавать заголовки запроса:

    const block = de.http( {
        url: 'https://api.some.host.com:33333/v1/get/foo/',
        headers: {
            'x-auth-token': 'qwerty123456'
        }
    } );

(TODO: параметры про SSL и Agent).


### `de.object`, `de.array`

    const block_foo = de.http( ... );
    const block_bar = de.http( ... );

    const block_object = {
        foo: block_foo,
        bar: block_bar
    };

    const block_array = [ foo, bar ];

Результатом исполнения блока `block_object` будет объект с двумя ключами `foo` и `bar`
и значениями, являющимися результатами выполнения блоков `block_foo` и `block_bar`.

Аналогино, результатом `block_array` будет массив из результатов блоков `block_foo` и `block_bar`.

Если у блока нет `options`, то можно не использовать `de.object`, `de.array`, а просто использовать
массивы и объекты, как выше. Если `options` нужны:

    const block = de.object( {
        block: {
            foo: block_foo,
            bar: block_bar
        },
        options: {
            ...
        }
    } );


### `de.func`

    const block_foo = de.http( {
        block: ...,
        options: {
            select: {
                ids: de.jexpr( '.result.items.id' )
            }
        }
    } )

    const block = {

        foo: block_foo,

        bar: de.func( {
            block: function( params, context, state ) {
                return state.ids.map( id => de.http( {
                    block: {
                        url: '...',
                        query: {
                            id: id
                        }
                    }
                } )
            },

            options: {
                deps: block_foo
            }
        } )

    };

