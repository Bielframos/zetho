import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'shortNumber',
    standalone: true,
})
export class ShortNumberPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value == null) return '';

        const abs = Math.abs(value);
        if (abs < 1000) return value.toString();

        const units = ['k', 'M', 'B', 'T'];
        let unitIndex = -1;
        let num = value;

        while (Math.abs(num) >= 1000 && unitIndex < units.length - 1) {
            num /= 1000;
            unitIndex++;
        }

        return num.toFixed(1).replace(/\.0$/, '') + units[unitIndex];
    }
}
