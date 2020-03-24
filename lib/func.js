'use strict'
const { getDate, addDays, parseISO } = require("date-fns");

module.exports = {
    async Pickup_time() {
        let day = new Date().getDay();
        let dd = new Date().toISOString().replace(/\.\d{3}Z$/, '').split('T');
        let ff = parseISO(dd[0] + 'T15:45:00')
        let pickup_time = ff.toISOString().replace(/\.\d{3}Z$/, '');
        let create_date = new Date().toISOString().replace(/\.\d{3}Z$/, '');

        if (day == 6 || day == 7) {
            let d = new Date().toISOString().replace(/\.\d{3}Z$/, '').split('T');
            let f = parseISO(d[0] + 'T15:45:00')
            let t = addDays(f, 3)
            pickup_time = t.toISOString().replace(/\.\d{3}Z$/, '');

        }
        return { pickup_time: pickup_time, create_date: create_date }
    }
}