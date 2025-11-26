import { Component, input } from "@angular/core";
import { ZStatsRow } from "../../../core/types";
import { ShortNumberPipe } from "../../../core/modules/pipes";

@Component({
    selector: 'ui-game-stats',
    standalone: true,
    template: `
    <div class="@container">
        <div
            class="flex flex-col @md:grid max-md:divide-y divide-gray-6 grid-cols-2 overflow-hidden border rounded-lg border-gray-6 bg-blue-2">

            <!-- Zerado -->
            <div class="col-span-2 @md:border-b border-gray-6 px-4 py-4 text-gray-11 flex justify-between">
                <div class="flex gap-2 items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M18.3125 11.0996H1.3418L14.0645 23.8223C13.3937 23.9386 12.704 24 12 24C5.37258 24 0 18.6274 0 12C0 6.80406 3.30252 2.37992 7.92285 0.710938L18.3125 11.0996ZM12 0C18.6274 0 24 5.37258 24 12C24 17.1965 20.6963 21.6195 16.0752 23.2881L5.6875 12.9004H22.6582L9.93457 0.176758C10.6056 0.0603575 11.2957 0 12 0Z"
                            fill="var(--color-gray-11)" />
                    </svg>
                    <span>Zerado</span>
                </div>
                <span>{{ stats()?.completedCount | shortNumber }}</span>
            </div>

            <!-- Demais categorias -->
            @for (item of entries; track $index) {
                <div
                    class="{{ item.classes }} px-4 py-4 text-gray-11 flex justify-between">
                    <div class="flex gap-2 items-center">
                        <i class="{{ item.icon }} text-gray-11"></i>
                        <span>{{ item.label }}</span>
                    </div>
                    <span>{{ stats()?.[item.key] | shortNumber }}</span>
                </div>
            }
        </div>
    </div>
    `,
    imports: [ShortNumberPipe]
})
export class UiGameStats {
    stats = input<ZStatsRow>();

    // Estrutura para reduzir repetição no template
    entries = [
        {
            key: 'backlogCount',
            label: 'Backlog',
            icon: 'ph-fill ph-books',
            classes: '@md:border-b @md:border-r border-gray-6'
        },
        {
            key: 'playingCount',
            label: 'Jogando',
            icon: 'ph-fill ph-game-controller',
            classes: '@md:border-b border-gray-6'
        },
        {
            key: 'droppedCount',
            label: 'Droparam',
            icon: 'ph-fill ph-x-circle',
            classes: '@md:border-r border-gray-6'
        },
        {
            key: 'wishlistCount',
            label: 'Lista de Desejos',
            icon: 'ph-fill ph-list-star',
            classes: ''
        }
    ] as const;
}
