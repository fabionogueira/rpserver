//@ts-check

const RPServer = require('.')
const TokenManager = require('./token-manager')
const grant = require('./grant')
const Response = require('./response')

/**
 * @typedef {Object<string, any>} TypeRouteOptions
 * @property {RPServer} rps
 * @property {string} method
 * @property {string} path
 * @property {TokenManager} token
*/

/**
 * @typedef {Object<string, boolean | number | Function>} TypeMemberOf
*/

/**
 * @callback RouteCallback
 * @param {*} data
 * @param {import('./response').TypeResponse} response
 */

class Route{
    /**
     * @param {TypeRouteOptions} param0 
     */
    constructor({rps, method, path, token}){
        this._method = method.toLowerCase()
        this._path = path
        this._rps = rps
        this._token = token
        this._rule = null
        this._memberOf = null

        Route.count++
        
        if (!'get post put delete'.includes(this._method)){
            throw `ivalidate route method [${this._method}], use get, post, put or get`
        }
    }

    /**
     * @param {TypeMemberOf} def 
     */
    memberOf(def){
        this._memberOf = def
        return this
    }

    rule(def){
        this._rule = def
        return this
    }

    /**
     * @param {RouteCallback} callback 
     */
    request(callback){
        let express = this._rps._express

        /**
         * @param {import('express').Request} req
         * @param {import('express').Response} res
         */
        express[this._method](this._path, (req, res)=>{
            let decodedToken, r
            let memberOf = this._memberOf
            let rule = this._rule
            let accessToken = req.headers['access_token'] ||
                req.headers['authorization'] ||
                req.query.access_token || 
                req.body.access_token
            
            if (!req.secure && req.get('x-forwarded-proto') !== 'https' && req.host !== "localhost") {
                return res.status(401).json({
                    error: 'unsupported_over_http',
                    message: 'IAuth only supports the calls over https'
                })
            }

            if (!memberOf){
                return doRoute(req, res)
            }
            
            try {
                r = this._token.validate(accessToken)

                if (r === true){
                    decodedToken = this._token.decoder(accessToken)
                } else {
                    return res.status(401).json({
                        error: r.name,
                        message: r.message
                    })    
                }

            } catch (error) {
                return res.status(401).json({
                    error: error.name,
                    message: error.message
                })
            }

            grant(req, {
                decodedToken,
                memberOf,
                rule,
                allows(){
                    doRoute(req, res)      
                },
                denied(){
                    res.status(401).json({
                        error: 'unauthorized_access',
                        message: 'Unauthorized Access'
                    })
                }
            })

        })
        
        /**
         * @param {import('express').Request} req
         * @param {import('express').Response} res
         */
        function doRoute(req, res){
            let k
            let json = {
                headers: req.headers,
                params: req.params,
                body: req.body,
                query: req.query
            }

            // tenta converter os tipos de dados de params e query
            for (k in json.params){
                json.params[k] = parseData(json.params[k])
            }
            for (k in json.query){
                json.query[k] = parseData(json.query[k])
            }

            callback(json, Response(res))
        }

        return this
    }
}

Route.count = 0

function parseData(d){
    let r

    try{
        r = JSON.parse(d)
    }catch(_e){
        return d
    }

    return r
}

module.exports = Route
