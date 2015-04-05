'use strict';

function arrayfy(o){
    return !o? []:
        Array.isArray(o)? o: [o];
}

module.exports = {
    arrayfy: arrayfy
}
