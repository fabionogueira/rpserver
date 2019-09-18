//@ts-check

/**
 * @typedef {Object<string, any>} TypeGrantOptions
 * @property {import('./route').TypeMemberOf} memberOf
 * @property {*} decodedToken
 * @property {Function | boolean} rule
 * @property {Function} allows
 * @property {Function} denied
*/

/**
 * @param {import('express').Request} req
 * @param {TypeGrantOptions} options
 */
module.exports = function(req, options){
    let group, r
    let routeMemberOf = options.memberOf
    let decodedToken = options.decodedToken
    let userMemberOf = decodedToken.memberOf || {}
    let rule = options.rule

    if (!routeMemberOf){
       return allows()
    }
    
    if (Object.keys(routeMemberOf).length==0){
        return allows()
    }
    
    for (group in routeMemberOf){
       r = userMemberOf[group]

       if (typeof(r) == 'function'){
           r = r(routeMemberOf, userMemberOf, req)
       }

       if (r){
           return allows()
       }
   }

   function allows(){
        rule = typeof(rule) == 'function' ? rule(routeMemberOf, userMemberOf, req) : (rule === undefined || rule === null ? true : rule)

        if (!rule){
           return denied()
        }

        if (typeof(options.allows) == 'function'){
           options.allows()
        }

        return true
   }

   function denied(){
       if (typeof(options.denied) == 'function'){
           options.denied()
       }

       return false
   }

   return denied()
}