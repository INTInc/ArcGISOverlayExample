import { Plot } from '@int/geotoolkit/plot/Plot';
import { Map } from '@int/geotoolkit/map/Map';
import { ArcGISFeature } from '@int/geotoolkit/map/layers/ArcGISFeature';
import { DefaultColorProvider } from '@int/geotoolkit/util/DefaultColorProvider';
import { Iterator } from '@int/geotoolkit/util/iterator';
import { Polygon } from '@int/geotoolkit/map/features/adapters/Polygon';
import { Polygon as PolygonTemplate } from '@int/geotoolkit/map/features/templates/Polygon';
import { Polygon as PolygonShape } from '@int/geotoolkit/scene/shapes/Polygon';
import { LineStyle } from '@int/geotoolkit/attributes/LineStyle';
import { Group } from '@int/geotoolkit/scene/Group';
import { CssLayout } from '@int/geotoolkit/layout/CssLayout';
import { ToolsContainer } from '@int/geotoolkit/controls/tools/ToolsContainer';
import { Point } from '@int/geotoolkit/util/Point';
import { GeodeticSystem } from '@int/geotoolkit/map/GeodeticSystem';
import { Tile } from '@int/geotoolkit/map/layers/Tile';
import { BaseConverter } from '@int/geotoolkit/map/features/converters/BaseConverter';
import { RDP } from '@int/geotoolkit/map/features/converters/RDP';
import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.css']
})
export class OverlayComponent implements AfterViewInit {
  @ViewChild('map', { static: true }) canvas: ElementRef;
  @ViewChild('parent', { static: true }) parent: ElementRef;
  private plot: Plot;
  private widget: Map;
  private countriesLayer: ArcGISFeature;

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
    const queryColorProvider = new DefaultColorProvider({
      'colors': ['red', 'white'],
      'values': [0, 1]
    });
    const itPopulatedCountries = this.countriesLayer.getFeatures();
    const fieldName = 'pop2000';
    const arPopulatedCountries = Iterator.toArray(itPopulatedCountries, undefined);
    arPopulatedCountries.sort(function (c1, c2) { // Descending
      const p1 = c1.getAttributes()[fieldName];
      const p2 = c2.getAttributes()[fieldName];
      return ((p1 === p2) ? 0 : ((p1 < p2) ? 1 : -1));
    });
    const geometryToPolygon = new Polygon();
    for (let iCountry = 0; iCountry < arPopulatedCountries.length; ++iCountry) {
      const country = arPopulatedCountries[iCountry];
      if (country != null) {
        const color = queryColorProvider.getColor(iCountry / (arPopulatedCountries.length - 1));
        const template = new PolygonTemplate();
        template.setProperties({
          'shape': new PolygonShape({
            'linestyle': new LineStyle('white'),
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
    this.plot = new Plot({
      'canvaselement': this.canvas.nativeElement,
      'root': new Group({ 'children': [widget] })
        .setAutoModelLimitsMode(true)
        .setLayout(new CssLayout()),
      'autoupdate': true
    });
    // init tools container to support interactions with widget
    const toolContainer = new ToolsContainer(this.plot);
    toolContainer.add(widget.getTool());
    widget.invalidate();
    this.widget = widget;
  }
  private createWidget(): Map {
    const map = new Map({});
    map.addLayer(this.createWMTSLayer());
    map.addLayer(this.createcountriesLayer());
    map.addLayer(this.createStatesLayer());
    map.setMapScale(1 / 200000)
      .panTo(new Point(-100, 40), GeodeticSystem.LatLon);
    return map;
  }
  private createWMTSLayer(): Tile {
    return new Tile({
      'url': 'https://demo.int.com/osm_tiles/',
      'minlod': 0,
      'maxlod': 19,
      'formatterfunction': function (z, x, y) {
        return z + '/' + y + '/' + x + '.png';
      }
    });
  }
  private createStatesLayer(): ArcGISFeature {
    return new ArcGISFeature({
      'system': GeodeticSystem.LatLon,
      'idfield': 'state_name',
      'converters': [
        new BaseConverter(),
        new RDP()
      ],
      'url': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
    });
  }
  private createcountriesLayer(): ArcGISFeature {
    const layer = new ArcGISFeature({
      'system': GeodeticSystem.LatLon,
      'idfield': null,
      'converters': [
        new BaseConverter(),
        new RDP()
      ],
      'url': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3'
    });
    this.countriesLayer = layer;
    return layer;
  }
  private resize(_event) {
    if (this.plot) {
      this.plot.setSize(this.parent.nativeElement.clientWidth, this.parent.nativeElement.clientHeight);
    }
  }
}
