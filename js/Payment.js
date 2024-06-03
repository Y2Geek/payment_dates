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