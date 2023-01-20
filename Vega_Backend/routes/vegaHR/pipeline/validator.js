const { check, validationResult } = require('express-validator/check');
const { body } = require('express-validator/check');
const moment = require('moment');
const _ = require('underscore');
module.exports = {
    validate: validate,
}

function validate(method) {
    switch (method) {
        case 'getCandidateOnBoardForBGV': {
            return [
                
            ]
        }
        case 'filterOnboardDataData': {
            return [
                
            ]
        }
        case 'updateJoiningDate': {
            return [
                
   
            ]
        }
        case 'fetchOfferLetter': {
            return [
               
            ]
        }
        case 'sendLinkToCandidate': {
            return [
               
            ]
        }
    }
}