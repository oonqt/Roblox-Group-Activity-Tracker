declare module "weeknumber" {
    export function dayOfYear(date?: Date): number;
    export function weekNumber(date?: Date): number;
    export function weekNumberSun(date?: Date): number;
    export function weekNumberSat(date?: Date): number;
    export function getYear(date: Date, week: number): number;
    export function weekNumberYear(date: Date): { year: number; week: number; day: number; }
    export function weekNumberYearSun(date: Date): { year: number; week: number; day: number; }
    export function weekNumberYearSat(date: Date): { year: number; week: number; day: number; }
}