# Changelog

## 0.0.26

  * [block.http] **breaking change**. Поменялась сигнатура `is_retry_allowed`. Было:

        is_retry_allowed( statuc_code, headers )

    стало (дефолтный вариант):

        is_retry_allowed: function( error ) {
            return (
                error.id === 'TCP_CONNECTION_TIMEOUT' ||
                error.id === 'REQUEST_TIMEOUT' ||
                error.status_code === 408 ||
                error.status_code === 429 ||
                error.status_code === 500 ||
                ( error.status_code >= 502 && error.status_code <= 504 )
            );
        }

