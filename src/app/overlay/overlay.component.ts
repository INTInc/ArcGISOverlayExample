import { Component, AfterViewInit, ViewChild, ElementRef, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.css']
})
export class OverlayComponent implements OnInit, AfterViewInit {
  @ViewChild('map', { static: true }) canvas: ElementRef;
  @ViewChild('parent', { static: true }) parent: ElementRef;
  private plot: geotoolkit.plot.Plot;
  private widget: geotoolkit.map.Map;
  private countriesLayer: geotoolkit.map.layers.ArcGISFeature;
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
  public zoomIn() {
    this.widget.zoomIn();
  }
  public zoomOut() {
    this.widget.zoomOut();
  }
  public classify() {
    const queryColorProvider = new geotoolkit.util.DefaultColorProvider({
      'colors': ['red', 'white'],
      'values': [0, 1]
    });
    const itPopulatedCountries = this.countriesLayer.getFeatures();
    const fieldName = 'pop2000';
    const arPopulatedCountries = geotoolkit.util.Iterator.toArray(itPopulatedCountries, undefined);
    arPopulatedCountries.sort(function (c1, c2) { // Descending
      const p1 = c1.getAttributes()[fieldName];
      const p2 = c2.getAttributes()[fieldName];
      return ((p1 === p2) ? 0 : ((p1 < p2) ? 1 : -1));
    });
    const geometryToPolygon = new geotoolkit.map.features.GeometryToPolygon();
    for (let iCountry = 0; iCountry < arPopulatedCountries.length; ++iCountry) {
      const country = arPopulatedCountries[iCountry];
      if (country != null) {
        const color = queryColorProvider.getColor(iCountry / (arPopulatedCountries.length - 1));
        const template = new geotoolkit.map.features.templates.Polygon();
        template.setOptions({
          'shape': new geotoolkit.scene.shapes.Polygon({
            'linestyle': new geotoolkit.attributes.LineStyle('white'),
            'fillstyle': { 'color': color }
          }),
          'geometrytoshape': geometryToPolygon
        });
        this.countriesLayer.setTemplate(country, template);
      }
    }
    this.countriesLayer.invalidate();
  }
  private initPlot() {
    const widget = this.createWidget();
    widget.setLayoutStyle({ 'left': 0, 'right': 0, 'top': 0, 'bottom': 0 });
    this.plot = new geotoolkit.plot.Plot({
      'canvasElement': this.canvas.nativeElement,
      'root': new geotoolkit.scene.Group({ 'children': [widget] })
        .setAutoModelLimitsMode(true)
        .setLayout(new geotoolkit.layout.CssLayout()),
      'autoUpdate': true
    });
    // init tools container to support interactions with widget
    const toolContainer = new geotoolkit.controls.tools.ToolsContainer(this.plot);
    toolContainer.add(widget.getTool());
    widget.invalidate();
    this.widget = widget;
  }
  private createWidget(): geotoolkit.map.Map {
    const map = new geotoolkit.map.Map({});
    map.addLayer(this.createWMTSLayer());
    map.addLayer(this.createcountriesLayer());
    map.addLayer(this.createStatesLayer());
    map.setMapScale(1 / 200000)
      .panTo(new geotoolkit.util.Point(-100, 40), geotoolkit.map.GeodeticSystem.LatLon);
    return map;
  }
  private createWMTSLayer(): geotoolkit.map.layers.Tile {
    return new geotoolkit.map.layers.Tile({
      'server': ['https://demo.int.com/osm_tiles/'],
      'minlod': 0,
      'maxlod': 19,
      'formatterfunction': function (z, x, y) {
        return z + '/' + y + '/' + x + '.png';
      }
    });
  }
  private createStatesLayer(): geotoolkit.map.layers.ArcGISFeature {
    return new geotoolkit.map.layers.ArcGISFeature({
      'system': geotoolkit.map.GeodeticSystem.LatLon,
      'idfield': 'state_name',
      'converters': [new geotoolkit.map.features.converters.DefaultFeatureConverter(),
      new geotoolkit.map.features.converters.RDPFeatureConverter()],
      'server': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
    });
  }
  private createcountriesLayer(): geotoolkit.map.layers.ArcGISFeature {
    const layer = new geotoolkit.map.layers.ArcGISFeature({
      'system': geotoolkit.map.GeodeticSystem.LatLon,
      'idfield': null,
      'converters': [
        new geotoolkit.map.features.converters.DefaultFeatureConverter(),
        new geotoolkit.map.features.converters.RDPFeatureConverter()],
      'server': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3'
    });
    this.countriesLayer = layer;
    layer.setCache(new geotoolkit.scene.ViewCache({'async': true}));
    return layer;
  }
  private resize(event) {
    if (this.plot) {
      this.plot.setSize(this.parent.nativeElement.clientWidth, this.parent.nativeElement.clientHeight);
    }
  }
}
