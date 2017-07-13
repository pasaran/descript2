# descript2

## Getting Started

```js
const http_ = require( 'http' );
const de = require( 'descript2' );
const router = require( './router' );

http_
    .createServer( function( req, res ) {
        const context = new de.Context( req, res );

        //  В этом гипотетическом примере роутер возвращает структуру вида:
        //
        //      {
        //          block,
        //          params,
        //          template
        //      }
        //
        //  Конечно, в роутер можно передавать и `req.url` и `req`,
        //  но лучше сразу весь `context`.
        //
        const route = router( context );

        //  Запускаем блок с параметрами.
        context.run( route.block, route.params )
            .then( function( result ) {
                //  В `result` может быть и ошибка.
                if ( de.is_error( result ) ) {
                    res.statusCode = 500;
                    res.end();

                } else {
                    //  Если все хорошо, накладываем шаблон.
                    const html = route.template( result );
                    res.end( html );
                }
            } );

    } )
    .listen( 8000 );
```

## Documentation

  * [Блоки](./blocks.md)

  * Виды блоков:

      * [Http](./block.http.md)
      * [File](./block.file.md)
      * [Value](./block.value.md)
      * [Array and Object](./block.composite.md)
      * [Func](./block.func.md)

  * [Параметры блоков](./options.md)
  * [Расширение блоков](./extend.md)
  * [Фазы выполнения блока](./phases.md)
  * [Контекст](./context.md)

