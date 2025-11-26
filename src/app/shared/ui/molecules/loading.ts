import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-loading',
  template: `
    <div
      class="relative w-full flex flex-col items-center py-6 gap-4 text-blue-6"
      animate.enter="enter-animation"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="animate-spin"
      >
        <path
          d="M14.7695 1.84668H18.4619V3.69238H20.3076V5.53809H22.1543V9.23047H24V14.7695H22.1543V18.4619H20.3076V20.3076H18.4619V22.1543H14.7695V24H9.23047V22.1543H5.53809V20.3076H3.69238V18.4619H1.8457V14.7695H0V9.23047H1.8457V5.53809H3.69238V3.69238H5.53809V1.84668H9.23047V0H14.7695V1.84668ZM5.53809 4.61523V8.30762H12.9229V10.1543H11.0771V12H9.23047V13.8457H7.38477V15.6924H5.53809V19.3848H18.4619V15.6924H12.9229V13.8457H14.7695V12H16.6152V10.1543H18.4619V4.61523H5.53809Z"
          fill="currentcolor"
        />
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
    `,
})
export class UiLoading {
  fallback = input<string>();
}
