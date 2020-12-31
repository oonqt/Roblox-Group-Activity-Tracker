import * as weeknumber from 'weeknumber';

export function getCurrentWeek(): string {
    let date = new Date(new Date().toLocaleString(undefined, { timeZone: 'Europe/London' }));

    return `${date.getFullYear()}-W${weeknumber.weekNumberSat(date) + 1}`;
}