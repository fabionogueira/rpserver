/**
 * @credits http://almostidle.com/tutorial/javascript-string-compression
 */

const LZW = {
    // LZW-compress a string
    encode(s) {
        let dict = {}
        let data = (s + "").split("")
        let out = []
        let currChar
        let phrase = data[0]
        let code = 256
        let i

        for (i=1; i<data.length; i++) {
            currChar=data[i]
            if (dict['_' + phrase + currChar] != null) {
                phrase += currChar
            }
            else {
                out.push(phrase.length > 1 ? dict['_'+phrase] : phrase.charCodeAt(0))
                dict['_' + phrase + currChar] = code
                code++
                phrase=currChar
            }
        }
        
        out.push(phrase.length > 1 ? dict['_'+phrase] : phrase.charCodeAt(0))
        
        for (i=0; i<out.length; i++) {
            out[i] = String.fromCharCode(out[i])
        }

        return out.join("")
    },
    
    // Decompress an LZW-encoded string
    decode(s) {
        let dict = {}
        let data = (s + "").split("")
        let currChar = data[0]
        let oldPhrase = currChar
        let out = [currChar]
        let code = 256
        let i, phrase, currCode

        for (i=1; i<data.length; i++) {
            currCode = data[i].charCodeAt(0)
            
            if (currCode < 256) {
                phrase = data[i]
            }
            else {
                phrase = dict['_'+currCode] ? dict['_'+currCode] : (oldPhrase + currChar)
            }

            out.push(phrase)
            currChar = phrase.charAt(0)
            dict['_'+code] = oldPhrase + currChar
            code++
            oldPhrase = phrase
        }
        return out.join("")
    },
    
    encode_utf8(s) {
        return unescape(encodeURIComponent(s))
    },
    
    decode_utf8(s) {
        return decodeURIComponent(escape(s))
    }
}

module.exports = LZW
