'use strict';
var crypto = require('crypto-js');
var moment = require('moment');

class Util {
    static hmac(key, string, digest) {
        if (digest !== undefined && digest.toLowerCase() == 'hex') {
            return crypto.HmacSHA256(string,key).toString(crypto.enc.HEX);
        } else {
            return crypto.HmacSHA256(string,key);
        }
    }

	static getHexEncodedHash(string) {
		return crypto.SHA256(string).toString(crypto.enc.HEX);
	}


	static uriEscape(string) {
		var output = encodeURIComponent(string);
		output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

		// AWS percent-encodes some extra non-standard characters in a URI
		output = output.replace(/[*]/g, function(ch) {
			return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
		});

		return output;
	}

	static formatDateTime(datetimeString) {
		if (!moment(datetimeString).isValid()) throw "Unacceptable datetime string"; // is warning message shows , please comment out moment.js line 850
		return moment(datetimeString).toISOString().replace(/[:\-]|\.\d{3}/g, '');
	}	
}

module.exports = Util;
