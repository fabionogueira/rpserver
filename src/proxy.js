// @ts-check


/**************************************
 * @file proxy.js
 * @author Fábio Nogueira <fabio.bacabal@gmail.com>
 * @version 1.0.0
 * @description
 *   Retorna um conteúdo de uma url externa registrada em config
 *   /proxy
 *      POST Raw Application/JSON
 *      {
 *          "target": "target-proxy-name",
 *          "data"  : {}
 *      }
 * 
 *   Exemplo de config
 *      {
 *          "target-proxy-name": {
 *              // required
 *              "url": "http://external.api.url/",
 *              "method": "POST",
 * 
 *              // optional
 *              "headers":{
 *                  "authorization": "Basic xyz"
 *              },
 *              "request": (data) => {
 *                  return { json from api }
 *              },
 *              "response": (err, response, next:Function) {
 *                  next ({ processed json response });
 *              }
 *          }
 *      }
*/

const request = require("request");

let _conf = {};

module.exports = class Proxy {

    static config(config, app){
        let self = this;
        
        _conf = config;

        if (config){
            app.post('/api/proxy/', (req, res) => {
                self.proxy(req, res);
            });
        }
    }

    static proxy(req, res){
        let json,
            r = _conf[req.body.target],
            data = req.body.data;
        
        if (!r){
            return res.sendStatus(404);
        }
    
        json = typeof(r.request)=='function' ? r.request(data || {}) : (data || r.request);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        function doResponseSuccess(payload){
            res.status(200).json(payload);
        }

        function complete(err, response){
            if (err){
                if (r.response){
                    return r.response(err, null, (error, payload)=>{
                        if (error){
                            res.status(500).json(error);
                        }else{
                            doResponseSuccess(payload);
                        }
                    });
                }else{
                    return res.status(500).json(err);
                }
            }
    
            if (response.statusCode!=200){
                return res.status(response.statusCode).json();
            }
    
            if (r.response){
                return r.response(null, response, (error, payload)=>{
                    if (error){
                        res.status(500).json(error);
                    }else{
                        doResponseSuccess(payload);
                    }
                });
            }else{
                doResponseSuccess(response);
            }            
        }

        request({
            url    : r.url, 
            method : r.method, 
            json   : json,
            qs     : r.method=='GET' ? json : null, 
            headers: r.headers
        }, complete);
    }
}