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

@Pipe({
    name: 'relativeTime',
    standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        if (!value) return '';

        const time = (value instanceof Date ? value : new Date(value)).getTime();
        const now = Date.now();
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'agora mesmo';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} m atrás`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} h atrás`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} d atrás`;

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} mês(es) atrás`;

        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} ano(s) atrás`;
    }
}
