// @ts-check

function JSV(schema){
    let paths = []
    let defaultItens = {}
    let checkeds = {}
    let IS = {
        Any(){
            return true
        },
        Array(value){
            return Array.isArray(value)
        },
        Boolean(value){
            return typeof(value) == 'boolean'
        },
        Date(value){
            return true
        },
        Number(value){
            return typeof(value) == 'number'
        },
        Object(value){
            return typeof(value) == 'object'
        },
        String(value){
            return typeof(value) == 'string'
        },
        Null(value){
            return value === null
        },
        Undefined(value){
            return value === undefined
        }
    }
    let VALIDATOR = {
        max(value, max, def){
            return def.type == 'Number' ?
                value <= max : 
                value.length <= max
        },
        min(value, min, def){
            return def.type == 'Number' ?
                value >= min : 
                value.length >= min
        }
    }

    function parseSchema(parent_path, schema){
        for (let k in schema){
            parseItem(k, `${parent_path}/${k}`, schema[k])
        }
    
        paths.sort((a, b) => {
            if ( a.path < b.path ){
                return -1;
            }
            
            if ( a.path > b.path ){
                return 1;
            }
            
            return 0; 
        })
    }    
    function parseItem(key, path, item){
        let pdef, def, min, i, t, s, a, k, v
        let required = item == '<Undefined>' ? false : (key == '...' ? false : key.substring(key.length - 1) != '?')
        
        path = path.replace('?', '')
    
        // field: []
        if (Array.isArray(item)){
            min = item.length
            def = {
                type: 'Array',
                required,
                validators: {
                    max: item.length,
                    min: item.length
                }
            }
    
            item.forEach((ii, i) => {
                if (typeof(ii) == 'string'){
                    s = ii.split('|')[0]
                    if (s.substring(s.length-3) == '...'){
                        def.validators.max = 999999
                        min = i
                    }
                } 
                
                parseItem(String(i), `${path}/${i}`, ii)         
            })
    
            def.validators.min = min
            paths.push({path, def})
        }
    
        // field: {}
        else if (typeof(item) == 'object'){
            def = {
                type: 'Object',
                required,
                dynamic: false
            }
    
            for (i in item){
                v = item[i]
    
                if (i == '...'){
                    def.dynamic = true
                }
    
                parseItem(i, `${path}/${i}`, v)
            }
    
            paths.push({path, def})
        }
    
        // field: "<String>|<Boolean>|..."
        else {
            t = item.split('>')[0].substring(1)
            a = item.replace(`<${t}>`, '').split('|')
            
            def = {
                type: t,
                required
            }
    
            if (t == 'Object'){
                def['dynamic'] = true
            }
    
            if (t == 'Array'){
                def['validators'] = {
                    max: 999999,
                    min: 0
                }
            }
    
            a.forEach(v => {
                let p
                
                if (v){
                    p = v.split(':')
    
                    if (p[0]=='required'){
                        def.required = parseValue(p[1])
    
                    } else if (p[0]=='nullable'){
                        def.nullable = p[1] === undefined ? true : parseValue(p[1])
    
                    } else if (p[0] != '...') {
                        def.validators = def.validators || {}
                        def.validators[p[0]] = parseValue(p[1])
                    } else {
                        k = path.replace(path.substring(path.lastIndexOf('/')), '')
                        if (k){
                            defaultItens[k] = def
                        }
                    }
                }
            })
            
            paths.push({path, def})
        }
    
        if (key == '...'){
            k = path.replace(path.substring(path.lastIndexOf('/')), '')
            defaultItens[k] = def
        }
    }

    function validateItem(path, def, value){
        let typeValidator, i, fn
    
        checkeds[path] = true
    
        // validação de obrigatoriedade
        if (value === undefined){
            return (def.required) ? {
                path,
                message: `${path}: value is required`
            } : null
        }
    
        // validação de nulos
        if (value === null){
            return (!def.nullable) ? {
                path,
                message: `${path}: value can not be null`
            } : null
        }
    
        // validação do tipo de dado
        typeValidator = IS[def.type]
        if (typeof(typeValidator) != 'function'){
            return {
                path,
                message: `${path}: schema datatype <${def.type}> not found`
            }
        }
        if (!typeValidator(value)){
            return {
                path,
                message: `${path}: unexpected data type, expected <${def.type}>`
            }
        }
    
        // demais validações, definidas em def.validators
        if (def.validators){
            for (i in def.validators){
                fn = VALIDATOR[i]
                if (fn && !fn(value, def.validators[i], def)){
                    return {
                        path,
                        message: `${path}: validator ${i}:${def.validators[i]} error`
                    }
                }
            }
        }
    }

    parseSchema('', schema)

    function validate(data){
        let i, j, k, v, path, obj, def, value, error
    
        for (i = 0; i < paths.length; i++){
            obj = paths[i]
            def = obj.def
            path = obj.path
            value = getDataValue(path, data, def.type)
        
            error = validateItem(path, def, value)
        
            if (error) {
                return error
            }
        }
    
        for (i in defaultItens){
            // p = paths.find(o=>o.path == i)
            obj = defaultItens[i]
            value = getDataValue(i, data)
    
            if (Array.isArray(value)){
                for (j=0; j<value.length; j++){
                    k = `${i}/${j}`
                    v = value[j]
    
                    if (!checkeds[k]){
                        error = validateItem(k, def, v)
                        
                        if (error) {
                            return error
                        }
                    }
                }
    
            } else if (typeof(value) == 'object'){
                for (j in value){
                    k = `${i}/${j}`
                    v = value[j]
    
                    if (!checkeds[k]){
                        error = validateItem(k, def, v)
                        
                        if (error) {
                            return error
                        }
                    }
                }
            }
        }
    
        return true
    }
    function strToValue(data){
        // let i, j, k, v, path, obj, def, value, error
        
    
        // for (i = 0; i < paths.length; i++){
        //     obj = paths[i]
        //     def = obj.def
        //     path = obj.path
        //     value = getDataValue(path, data)
            
        //     if (typeof(value) == 'string'){
        //         switch (def.type){

        //         }
        //     }

        //     error = validateItem(path, def, value)
        
        //     if (error) {
        //         return error
        //     }
        // }
    }
    function getPaths(){
        return paths
    }

    return {
        validate,
        getDataValue,
        getPaths,
        strToValue
    }
}

function parseValue(value){
    let sBoolean = {
        'true': true,
        'false': false
    }
    let v = Number(value)

    if (!isNaN(v)){
        return v
    }

    if (sBoolean[value] != undefined){
        return sBoolean[value]
    }

    return value
}

function getDataValue(path, data, type = null){
    let i, k
    let res = data
    let arr = path.split('/')

    if (type == 'Null') {
        return null
    }

    if (type == 'Undefined') {
        return undefined
    }

    for (i = 1; i < arr.length; i++){
        k = arr[i]
        res = res ? res[k] : undefined
    }

    return type == 'Date' ? (res==undefined ? undefined : (res|| null) ) : res
}

module.exports = JSV