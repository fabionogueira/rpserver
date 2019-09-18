// @ts-check

const fs = require('fs')

let version = '1.0.0'

class SessionManager{
    constructor(options) {
        this._version = version
        this._session_path = options.path

        if (!fs.existsSync(this._session_path)) {
            fs.mkdirSync(this._session_path)
        }
    }

    async create(id, access_token, data = {}) {
        let k
        let session = {}
        
        for (k in data){
            session[k] = data[k]
        }

        //@ts-ignore
        session['created'] =  (new Date()).toLocaleString('pt-br', {timezone: 'Brazil/brt'})
        session['access_token'] = access_token
        session['version'] = version

        return await this.write(id, session)
    }

    destroy(id) {
        return new Promise((resolve, reject) => {
            let path = `${this._session_path}/${id}`
            
            fs.unlink(path, (err) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        return resolve(null)
                    }

                    return reject(err)
                }

                resolve(true)
            })
        })
    }

    get(id) {
        return this.read(id)
    }

    read(file) {
        return new Promise((resolve, reject) => {
            let path = `${this._session_path}/${file}`
            
            if (!file){
                resolve(null)
            }

            fs.open(path, 'r', (err) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        return resolve(null)
                    }
              
                    reject(err)
                }
              
                fs.readFile(path, (error, data) => {
                    if (error){
                        return reject(error)
                    }

                    resolve(data)
                })
            })
        })
    }

    write(file, sessionData) {
        return new Promise((resolve, reject) => {
            let path = `${this._session_path}/${file}`
    
            fs.open(path, 'r', (err) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        fs.closeSync(fs.openSync(path, 'a'))
                        
                    } else {
                        reject(err)
                    }
              
                }
              
                fs.writeFile(path, JSON.stringify(sessionData, null, 4), (error) => {
                    if (error){
                        return reject(error)
                    }

                    resolve(true)
                })
            })
        })
    }

}

module.exports = SessionManager