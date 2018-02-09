import { Component, ViewChild } from '@angular/core';
import { OverlayComponent } from './overlay/overlay.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild(OverlayComponent) map: OverlayComponent;
  title = 'app';
  public zoomIn() {
    this.map.zoomIn();
  }
  public zoomOut() {
    this.map.zoomOut();
  }
  public classify() {
    this.map.classify(); 
  }
}
