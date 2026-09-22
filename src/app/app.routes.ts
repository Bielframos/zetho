import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({ template: '' })
class MaintenanceRoute {}

export const routes: Routes = [
  { path: '**', component: MaintenanceRoute, title: 'Zetho em manutenção' },
];
