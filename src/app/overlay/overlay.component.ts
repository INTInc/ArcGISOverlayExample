import { Component, AfterViewInit, ViewChild, ElementRef, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.css']
})
export class OverlayComponent implements OnInit, AfterViewInit {
  @ViewChild('map') canvas: ElementRef;
  @ViewChild('parent') parent: ElementRef;
  private plot: geotoolkit.plot.Plot;
  private widget: geotoolkit.map.Map;

  constructor() { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    this.initPlot();
    this.resize(null);
  }
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.resize(event);
  }
  private initPlot() {
    let widget = this.createWidget();
    widget.setLayoutStyle({ 'left': 0, 'right': 0, 'top': 0, 'bottom': 0 });
    this.plot = new geotoolkit.plot.Plot({
      'canvasElement': this.canvas.nativeElement,
      'root': new geotoolkit.scene.Group({ 'children': [widget] })
        .setAutoModelLimitsMode(true)
        .setLayout(new geotoolkit.layout.CssLayout()),
      'autoUpdate': true
    });
    // init tools container to support interactions with widget
    var toolContainer = new geotoolkit.controls.tools.ToolsContainer(this.plot);
    toolContainer.add(widget.getTool());
    widget.invalidate();
    this.widget = widget;
  }
  private createWidget(): geotoolkit.map.Map {
    let map = new geotoolkit.map.Map({});
    map.addLayer(this.createWMTSLayer());
    map.addLayer(this.createCountiesLayer());
    map.addLayer(this.createStatesLayer());
    map.setMapScale(1 / 200000)
      .panTo(new geotoolkit.util.Point(-100, 40), geotoolkit.map.GeodeticSystem.LatLon);
    return map;
  }
  private createWMTSLayer(): geotoolkit.map.layers.WMTSLayer {
    return new geotoolkit.map.layers.WMTSLayer({
      'server': ['https://demo.int.com/osm_tiles/'],
      'minlod': 0,
      'maxlod': 19,
      'formatterfunction': function (z, x, y) {
        return z + '/' + y + '/' + x + '.png';
      }
    });
  }  
  private createStatesLayer(): geotoolkit.map.layers.ArcGISFeatureLayer {
    return new geotoolkit.map.layers.ArcGISFeatureLayer({
      'system': geotoolkit.map.GeodeticSystem.LatLon,
      'idfield': 'state_name',
      'server': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
    });
  };
  private createCountiesLayer(): geotoolkit.map.layers.ArcGISFeatureLayer {
    let layer = new geotoolkit.map.layers.ArcGISFeatureLayer({
      'system': geotoolkit.map.GeodeticSystem.LatLon,
      'idfield': null,
      'server': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3'
    });
    layer.setCache(new geotoolkit.scene.TiledCache());
    return layer;
  };
  
  private resize(event) {
    if (this.plot) {
      this.plot.setSize(this.parent.nativeElement.clientWidth, this.parent.nativeElement.clientHeight);
    }
  }
}
