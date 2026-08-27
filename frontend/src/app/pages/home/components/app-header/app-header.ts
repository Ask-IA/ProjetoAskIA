import { CommonModule } from '@angular/common';
import { AfterViewInit, Component} from '@angular/core';
import { RouterLink } from '@angular/router';

declare const lucide:any;

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
})
export class AppHeader implements AfterViewInit {
  isMobileMenuOpen = false;

  ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}