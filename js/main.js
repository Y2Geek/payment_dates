let fileContents = [];
let allPayments = [];

/**
 * A function to monitor the dates, if dates are not valid, the button is disabled.
 */
function goButtonStatus() {
    let dates = getDates();
    let goButton = getElement('id', 'goButton');

    if(dates[0] < dates[1]) {
            goButton.removeAttribute('disabled');
            goButton.style.background = 'green';
    }
    else {
        goButton.setAttribute('disabled', true);
        goButton.style.background = 'grey';
    }
}


/**
 * A function to load all the contents from the uploaded file.
 * @param {Blob} f f 
 */
function getFileContents(f) {
    let fr = new FileReader();
    fr.onload = function(e) {
        fileContents = e.target.result;
        fileContents = fileContents.toString();
        fileContents = fileContents.split('\n');
    };
    fr.readAsText(f[0]);
}


/**
 * A function to send lines with specific number of parts to create a payments
 */
function getAllPayments() {
    // Reset allPayments
    allPayments = [];
    
    // Create payments.
    if(fileContents.length != 0) {
        for(let line of fileContents) {
            // split using ; as comma maybe used in larger numbers
            let parts = line.split(';');
            // If parts is not between following, move on
            switch(parts.length) {
                case 4:
                case 5:
                case 6:
                    let pay = createPayment(parts);
                    allPayments.push(pay);
            }
        }
    }
}


/**
 * Gathers a list of payments that are within the given start and end dates.
 * @returns Array of Payment Objects
 */
function getUpcomingPayments() {
    let dates = getDates();
    let upcoming = [];
    // Reset the allPayments to initial state.
    getAllPayments();

    if(allPayments.length != 0) {
        // update dates of all payments that are not single payments
        for(let payment of allPayments) {
            let isOngoingPayment = payment instanceof OngoingPayment;

            // Check that payment can move forward
            if(isOngoingPayment) {
                // Ensure payment date is equal to or later than start date.
                updatePaymentDate(payment, dates[0]);
            }
            
            // Now check if payment is within given dates
            let tmpDate = cloneDate(payment.date);
            if(tmpDate >= dates[0] && tmpDate < dates[1]) {
                let addPayment = true;
                
                // Make sure limited payments don't exceed their end date
                if(payment instanceof LimitedPayment) {
                    if(payment.endDate < tmpDate) {
                        addPayment = false;
                    }
                }
                
                if(addPayment) {
                    upcoming.push(payment);
                    if(isOngoingPayment) {
                        // If the payment is ongoing, clone, move date forward and re-add 
                        // as may appear again within dates.
                        let pay = payment.clone();
                        pay.moveDateAhead();
                        allPayments.push(pay);
                    }
                }
            }
        }
    }
    upcoming = upcoming.sort(function(p1, p2){
        return p1.date - p2.date || p1.type.localeCompare(p2.type) || p1.name.localeCompare(p2.name);
    });
    return upcoming;
}


/**
 * Move payment forward until date is equal or after start date.
 * @param {OngoingPayment} pay 
 * @param {Date} date 
 */
function updatePaymentDate(pay, date) {
    while(pay.date < date) {
        pay.moveDateAhead();
    }
}


/**
 * Function to be called by HTML and to provide the output for the HTML document.
 */
function getOutput() {
    // Refresh allPayments in case of cahnges 
    let payments = getUpcomingPayments();
    let msg = '';

    if(payments.length === 0) {
        msg = '<p id="error">&#128543;<br>No payments to show!<br>Please check your payment list file!</p>';
    } else {
        msg = '<table><tr><th>Date</th><th>Name</th><th>In</th><th>Out</th></tr>';

        for(let pay of payments) {
            msg += pay.shortString();
        }
        msg += '</table>';
    }

    getElement('id', 'output').innerHTML = msg;
    getElement('id', 'totals').innerHTML = getTotals(payments);
}


/**
 * Gets the start and end date from the HTML form
 * @returns Array of Date objects
 */
function getDates() {
    let dates = [];
    
    // Start Date 
    dates[0] = getElement('name', 'startDate');
    dates[0] = new Date(dates[0][0].value + " 00:00:00");
    
    // End Date
    dates[1] = getElement('name', 'endDate');
    dates[1] = new Date(dates[1][0].value + " 00:00:00");

    if(dates[1] < dates[0]) {
        return [];
    } else {
        return dates;
    }
}


/**
 * Gets the total in, out and whats left.
 * Returns a string to display on HTML document.
 * @param {Array} payments 
 * @returns String
 */
function getTotals(payments) {
    let credits = [];
    let debits = [];

    for(let pay of payments) {
        if(pay.type === 'IN') {
            credits.push(pay.value);
        }
        else {
            debits.push(pay.value)
        }
    }

    let credit = calculateArray('addition', credits, 2);
    let debit = calculateArray('addition', debits, 2);
    let leaving = toDecimalPlaces(credit - debit);

    return `<hr><p><h2>Totals</h2>Paid in: £${credit}<br>Paid out: £${debit}<br>Leaving: £${leaving}</p>`;
}


/**
 * Converts data into a Payment, OngoingPayment or LimitedPayment object.
 * @param {Array} data 
 * @returns Payment Object
 */
function createPayment(data) {
    // Have data validated before creation
    if(validatePaymentData(data)) {
        switch(data.length) {
            case 4:
                return new Payment(data[0], data[1], data[2], data[3]);
            case 5:
                return new OngoingPayment(data[0], data[1], data[2], data[3], data[4]);
            case 6:
            return new LimitedPayment(data[0], data[1], data[2], data[3], data[4], data[5]);
            default:
                console.log(`Failed to create payment: ${data}`);
        }
    }
}