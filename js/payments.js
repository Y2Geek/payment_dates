class Payment {
    _type;
    _date;
    _name;
    _value;

    constructor(type, date, name, value) {
        this._type = type;
        this._date = new Date(date + " 00:00:00");
        this._name = name;
        this._value = value;
    }
    get type() {
        return this._type;
    }
    get date() {
        return this._date;
    }
    get name() {
        return this._name;
    }
    get value() {
        return this._value;
    }
    shortString() {
        if(this._type === 'IN') {
            return `<tr><td>${this._date.toLocaleDateString()}</td><td class='payName'>${this._name}</td><td>${this._value}</td><td></td></tr>`;
        } else {
            return `<tr><td>${this._date.toLocaleDateString()}</td><td class='payName'>${this._name}</td><td></td><td>${this._value}</td></tr>`;
        }
    }
}


class OngoingPayment extends Payment {
    _frequency;

    constructor(type, date, name, value, frequency) {
        super(type, date, name, value);
        this._frequency = frequency;
    }
    clone() {
        return new OngoingPayment(this._type, this._date.toDateString(), this._name, this._value, this._frequency);
    }
    moveDateAhead() {
        switch(this._frequency) {
            case 'DAILY':
                this._date = addDays(this._date, 1);
                break;
            case 'WEEKLY':
                this._date = addWeeks(this._date, 1);
                break;
            case 'FORTNIGHTLY':
                this._date = addWeeks(this._date, 2);
                break;
            case 'FOURWEEKLY':
                this._date = addWeeks(this._date, 4);
                break;
            case 'MONTHLY':
                this._date = addMonths(this._date, 1);
                break;
            case 'QUARTERLY':
                this._date = addMonths(this._date, 3);
                break;
            case 'HALF-YEARLY':
                this._date = addMonths(this._date, 6);
                break;
            case 'YEARLY':
                this._date = addYears(this._date, 1);
                break;
        }
    }
}


class LimitedPayment extends OngoingPayment {
    _endDate;

    constructor(type, date, name, value, frequency, endDate) {
        super(type, date, name, value, frequency);
        this._endDate = new Date(endDate + " 00:00:00");
    }
    get endDate() {
        return this._endDate;
    }
    set endDate(value) {
        this._endDate = new Date(endDate + " 00:00:00");
    }
    clone() {
        return new LimitedPayment(this._type, this._date.toDateString(), this._name, this._value, this._frequency, this._endDate.toDateString());
    }
}


let fileContents = [];
let allPayments = [];


function switchTheme() {
    let currentClasses = getElement('tag', 'body')[0].classList;
    let button = getElement('id', 'switchButton');

    if(currentClasses.contains('light-theme')) {
        swapClassByTag(['body', 'form'], 'light-theme', 'dark-theme');
        button.innerText = 'Light Theme';
    } else {
        swapClassByTag(['body', 'form'], 'dark-theme', 'light-theme');
        button.innerText = 'Dark Theme';
    }
}


function goButtonStatus() {
    let dates = getDates();
    let goButton = document.getElementById('goButton');

    if(dates[0] < dates[1]) {
            goButton.removeAttribute('disabled');
            goButton.style.background = 'green';
    }
    else {
        goButton.setAttribute('disabled', true);
        goButton.style.background = 'grey';
    }
}


function getFileContents(f) {
    let fr = new FileReader();
    fr.onload = function(e) {
        fileContents = e.target.result;
        fileContents = fileContents.toString();
        fileContents = fileContents.split('\n');
    };
    fr.readAsText(f[0]);
}


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


function getUpcomingPayments() {
    let dates = getDates();
    let upcoming = [];
    getAllPayments();

    // Dates[0] start date dates[1] end date
    if(dates.length != 0) { 
        if(allPayments.length != 0) {
            // update dates of all payments
            for(let payment of allPayments) {
                let isOngoingPayment = payment instanceof OngoingPayment;

                // Check that payment can move forward
                if(isOngoingPayment) {
                    updatePaymentDate(payment, dates[0]);
                }
                
                // Now check if payment is within given dates
                let tmpDate = new Date(payment.date.toString());
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
    }
    upcoming = upcoming.sort(function(p1, p2){
        return p1.date - p2.date || p1.type.localeCompare(p2.type) || p1.name.localeCompare(p2.name);
    });
    return upcoming;
}


function updatePaymentDate(pay, date) {
    while(pay.date < date) {
        pay.moveDateAhead();
    }
}


function getOutput() {
    // Refresh allPayments in case of cahnges 
    let payments = getUpcomingPayments();
    let msg = '';

    if(payments.length === 0) {
        msg = '<p id="error">&#128543;<br>No payments to show!<br>Please check your payment list file!</p>';
    } else {
        msg = '<tr><th>Date</th><th>Name</th><th>In</th><th>Out</th>';

        for(let pay of payments) {
            msg += pay.shortString();
        }

        document.getElementById('totals').innerHTML = getTotals(payments);
    }

    document.getElementById('output').innerHTML = msg;
}


function getDates() {
    let dates = [];
    
    // Start Date 
    dates[0] = document.getElementsByName('startDate');
    dates[0] = new Date(dates[0][0].value + " 00:00:00");
    
    // End Date
    dates[1] = document.getElementsByName('endDate');
    dates[1] = new Date(dates[1][0].value + " 00:00:00");

    if(dates[1] < dates[0]) {
        return [];
    } else {
        return dates;
    }
}


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


function validatePaymentData(data) {
    // Array of validation methods
    let validation = [validType(data[0]), validDate(data[1]), validValue(data[3])];
    // Check if frequency is present
    if(data.length === 5) {
        validation.push(validFrequency(data[4]));
    } else if(data.length === 6) {
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


function validType(type) {
    switch(type) {
        case 'IN':
        case 'OUT':
            return true;
        default:
            return false;
    }
}


function validDate(date) {
    let dateParts = date.split("-");

    if (dateParts[0].match(/\d{4}/)) {
        if(dateParts[1] >= 1 && dateParts[1] <= 12) {
            if(dateParts[1] >= 1 && dateParts[1] <= 31) {
                return true;
            }
        }
    }

    return false;
}


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