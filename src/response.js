//@ts-check


/**
 * @callback ErrorMethod
 * @param {*} definition
*/

/**
 * @callback SuccessMethod
 * @param {*} payload
*/

/**
 * @typedef {Object<string, any>} TypeResponse
 * @property {ErrorMethod} error
 * @property {SuccessMethod} success
*/

/**
 * @param {import('express').Response} res
 * @returns {TypeResponse}
 */
module.exports = (res) => {
    return {
        error(definition){
            let json
            
            definition = typeof(definition) == 'string' ? {message: definition} :  definition

            json = {
                error: definition.error || definition.code || definition.name || 'throw',
                message: (definition.original && definition.original.message ? definition.original.message : (definition.message || 'undefined error'))
            }

            res.status(definition.status || 401).json(json)
        },

        // 200
        success(payload){
            res.status(200).json(payload || {})
        }
        
    }
}

