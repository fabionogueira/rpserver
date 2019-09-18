// @ts-check

const jwt = require('jsonwebtoken');
const lzw = require('./lib/lzw')

class TokenManager {
    /**
     * @param {string} publicKey 
     * @param {string} privateKey 
     */
    constructor(publicKey, privateKey){
        this._publicKey = publicKey;
        this._privateKey = privateKey;
    }

    /**
     * @param {*} [payload]
     * @param {string} [expiresIn]
     * @param {boolean} [encode]
     */
    create(payload = {}, expiresIn='1d', encode=false){
        if (encode) {
            payload = {_:lzw.encode(JSON.stringify(payload))}
        }

        // cria o token com base na chave privada
        return jwt.sign(payload, this._privateKey, {
            "algorithm": 'RS256',
            "expiresIn": expiresIn //em segundos: 60*1=1min, 60*60=3600=1h, 3600*24=1d 
        })
    }

    /**
     * @param {string} token 
     */
    validate(token) {
        try {
            jwt.verify(token, this._publicKey)
            return true

        } catch (error) {
            return error
        }    
    }

    /**
     * @param {string} token 
     */
    decoder(token){
        /** @type {any} */
        let decoded = jwt.decode(token)
        let json

        if (decoded && decoded._){
            json = JSON.parse(lzw.decode(decoded._))

            json.exp = decoded.exp
            json.iat = decoded.iat

            decoded = json
        }

        return decoded
    }
}

module.exports = TokenManager