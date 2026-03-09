import { Component } from '@angular/core';

@Component({
  selector: 'app-offline-page',
  standalone: true,
  templateUrl: './offline.html',
  host: {
    class: 'contents',
  },
})
export class OfflinePage {
  tryAgain() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
