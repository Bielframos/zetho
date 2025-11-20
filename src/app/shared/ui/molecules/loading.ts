import { Component, input } from "@angular/core";

@Component({
    selector: 'ui-loading',
    template: `
     <div class="relative w-full flex flex-col items-center py-6 gap-4 text-blue-6" animate.enter='enter-animation'>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
            class="animate-spin">
            <path
                d="M18.3125 11.0996H1.3418L14.0645 23.8223C13.3937 23.9386 12.704 24 12 24C5.37258 24 0 18.6274 0 12C0 6.80406 3.30252 2.37992 7.92285 0.710938L18.3125 11.0996ZM12 0C18.6274 0 24 5.37258 24 12C24 17.1965 20.6963 21.6195 16.0752 23.2881L5.6875 12.9004H22.6582L9.93457 0.176758C10.6056 0.0603575 11.2957 0 12 0Z"
                fill="currentcolor" />
        </svg>
        @if (fallback()) {
            <span class="text-gray-12">{{ fallback() }}</span>
        }
    </div>
    `,
    styles: `
    .enter-animation {
        animation: slide-and-scale .600s;
    }

    @keyframes slide-and-scale {
        from {
            opacity: 0;
             transform: translateY(20px) scale(0.2);
        }

        to {
            opacity: 1;
            transform: translateY(0) scale(1);
         }
    }
    `
})
export class UiLoading {
    fallback = input<string>()
}