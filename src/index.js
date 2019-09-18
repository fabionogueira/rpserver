//@ts-check

const net = require('net')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Route = require('./route')
const TokenManager = require('./token-manager')
const SessionManager = require('./session-manager')

/**
 * @typedef {Object<string, any>} TypeStatic
 * @property {string} [location]
 * @property {string} [path]
*/

/**
 * @typedef {Object<string, any>} TypeSecurity
 * @property {string} [tokenExpireIn]
 * @property {string} [tokenPublicKey]
 * @property {string} [tokenPrivateKey]
 * @property {string} [sessionPath]
*/

/**
 * @typedef {Object<string, any>} TypeRPServerOptions
 * @property {number} [port]
 * @property {string} [client]
 * @property {TypeStatic} [static]
 * @property {TypeSecurity} [security]
*/

class RPServer {
    /**
     * @param {TypeRPServerOptions} [options]
     */
    constructor(options = {}){
        let opt = this._options = Object.assign({
            port: null,
            client: `${__dirname}/client`,
            static: {},
            security:{}
        }, options)
        
        opt.static = Object.assign({
            location: '/static',
            path: `${__dirname}/static`
        }, opt.static)

        opt.security = Object.assign({
            tokenExpireIn: '1d',
            tokenPublicKey: '',
            tokenPrivateKey: '',
            sessionPath: `${__dirname}/sessions`
        }, opt.security)

        this._express = express()
        this.token = new TokenManager(opt.security.tokenPublicKey, opt.security.tokenPrivateKey)
        this.session = new SessionManager({path: opt.security.sessionPath})
        
        this._express
            .use(opt.static.location, express.static(opt.static.path))
            .use('/', express.static(opt.client))
            .use(cors())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({ extended: false }))
    }

    start(){
        let opt = this._options
        let express = this._express

        // if (Route.count == 0){
        //     this.get('/')
        //         .request((data, reponse)=>{
        //             reponse.success('server running, no route defined.')
        //         })
        // }

        if (!opt.port){
            getFreePort(doStart)

        } else {
            doStart(opt.port)
        }

        function doStart(port){
            express.listen(port, () => {
                console.log(`rest api running: port=${port}, client=${opt.client}`)
            })
        }
    }

    /**
     * @param {string} method 
     * @param {string} path 
     * @returns {Route}
     */
    route(method, path){
        let route = new Route({
            rps: this,
            token: this.token,
            method,
            path 
        })

        //@ts-ignore
        return route
    }

    get(path){
        return this.route('get', path)
    }

    post(path){
        return this.route('post', path)
    }

    put(path){
        return this.route('put', path)
    }

    delete(path){
        return this.route('delete', path)
    }

    /**
     * @param {string} id 
     * @param {import('./route').TypeMemberOf} memberOf 
     * @param {*} data 
     * @returns {Promise}
     */
    async auth (id, memberOf, data){
        let opt = this._options
        let payload = {
            memberOf,
            data
        }
        let access_token = await this.token.create(payload, opt.security.tokenExpireIn, true)
        
        // atualiza a sessão do usuário
        let flag = await this.session.create(id, access_token, data)
        
        if (flag){
            return {
                access_token,
                memberOf,
                data
            }
        }

        return null
    }
}

function getFreePort(next){
    let port = 80

    checkPort(port, result)

    function result(inUse){
        if (inUse){
            port = port == 80 ? 8080 : port + 1
            return checkPort(port, result)
        }
        
        next(port)
    }

    function checkPort(port, callback) {
        let server = net.createServer(function(socket) {
            socket.write('Echo server\r\n');
            socket.pipe(socket);
        });
    
        server.listen(port, '127.0.0.1')
        
        server.on('error', function (e) {
            callback(true)
        })

        server.on('listening', function (e) {
            server.close()
            callback(false)
        })
    }
}

/**

-- TEST --
let server = new RESTServer()

server.get('/api/login')
    .memberOf({})
    .request((data, response) => {
        let id = data.body.usuario

        if (id == 'fabio' && data.body.senha == '123'){
            let memberOf = {}
            let result = server.auth(id, memberOf)

            response.success(result)

        } else {
            response.error('usuário e/ou senha inválida.')
        }
    })

*/

module.exports = RPServer