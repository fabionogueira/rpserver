//@ts-check

const RPServer = require('../src')
const keys = require('./keys')

const rps = new RPServer({
    security:{
        tokenPrivateKey: keys.privateKey,
        tokenPublicKey: keys.publicKey,
        tokenExpireIn: '60min'
    }
})

rps.post('/login')
    .request(async (data, response)=>{
        let d
        let memberOf = null
        let {username, password} = data.body

        if (username == 'admin' && password == 'admin'){
            memberOf = {
                admin: true,
                user: true
            }

        } else if (username == 'user' && password == 'user') {
            memberOf = {
                user: true
            }

        } else {
            return response.error('autentication failure')
        }
            
        d = await rps.auth(data.body.username, memberOf, {custom_data:'ok'})

        //return data with access token
        return response.success(d)
    })

rps.get('/admin')
    .memberOf({
       admin: true
    })
   .request((data, response)=>{
        response.success('admin access ok')
   })

rps.get('/user/:id?') //optional id
    .memberOf({
        admin: true,
        user: true
   })
   .request((data, response)=>{
        response.success('user area access ok ' + data.params.id)
   })

rps.get('/public/')
  .request((data, response)=>{
       response.success('public area access ok')
  })

rps.start()