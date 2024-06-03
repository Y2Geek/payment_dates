/**
 * Runs a collection of validation functions on given data
 * @param {Array} data 
 * @returns Boolean
 */
function validatePaymentData(data) {
    // Array of validation methods
    let validation = [validType(data[0]), validDate(data[1]), validValue(data[3])];
    // Check if frequency is present
    if(data.length === 5) {
        validation.push(validFrequency(data[4]));
    } else if(data.length === 6) {
        validation.push(validFrequency(data[4]));
        validation.push(validDate(data[5]));
    }

    // Run validation checks
    for(let valid of validation) {
        // Check if not valid
        if(!valid) {
            // If not valid return false
            return false;
        }
    }

    // If all is successful, return true.
    return true;
}


/**
 * Checks that the payment type is In or OUT
 * Returns Boolean.
 * @param {String} type 
 * @returns Boolean
 */
function validType(type) {
    switch(type) {
        case 'IN':
        case 'OUT':
            return true;
        default:
            return false;
    }
}

/**
 * Checks that input is a valid date string.
 * Returns a Boolean
 * @param {String} date 
 * @returns Boolean
 */
function validDate(date) {
    let d = new Date(date);

    if(d == 'Invalid Date') {
        return false;
    } else {
        return true;
    }
}


/**
 * Checks if given value is a Number
 * @param {Number} value 
 * @returns Boolean
 */
function validValue(value) {
    // Check value is NOT NaN
    if(!Number.isNaN(value)) {
        // No negative numbers allowed
        if(value >= 0.0) {
            return true;
        }
    }
    return false;
}


/**
 * Checks that frequency is valid
 * @param {string} frequency 
 * @returns Boolean
 */
function validFrequency(frequency) {
    switch(frequency) {
        case 'DAILY':
        case 'WEEKLY':
        case 'FORTNIGHTLY':
        case 'FOURWEEKLY':
        case 'MONTHLY':
        case 'QUARTERLY':
        case 'HALF-YEARLY':
        case 'YEARLY':
            return true;
        default:
            return false;
    }
}