import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { FloodService } from '../../../core/services/flood.service';

@Component({
  selector: 'app-sensors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensors.html',
  styleUrls: ['./sensors.scss'],
})
export class SensorsComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  floodData: any[] = [];
  loading = true;

  get totalPoints() {
    return this.floodData.length;
  }
  get criticalCount() {
    return this.floodData.filter((d) => d.risk_level === 'critical').length;
  }
  get highCount() {
    return this.floodData.filter((d) => d.risk_level === 'high').length;
  }
  get moderateCount() {
    return this.floodData.filter((d) => d.risk_level === 'moderate').length;
  }
  get safeCount() {
    return this.floodData.filter((d) => d.risk_level === 'safe').length;
  }

  constructor(
    private floodService: FloodService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
    this.loadData();
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  loadData() {
    this.loading = true;
    this.floodService.getFloodData().subscribe({
      next: (res) => {
        if (res.success) {
          this.floodData = res.data;
          this.renderMarkers();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private initMap() {
    this.map = L.map('sensor-map', {
      center: [16.047, 108.206],
      zoom: 6,
      zoomControl: false,
    });
    L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      maxZoom: 20,
    }).addTo(this.map);
    L.control.zoom({ position: 'topleft' }).addTo(this.map);
  }

  private renderMarkers() {
    if (!this.map) return;
    const color: Record<string, string> = {
      critical: '#ef4444',
      high: '#f97316',
      moderate: '#f59e0b',
      safe: '#22c55e',
    };

    const icons: Record<string, L.DivIcon> = {};
    Object.keys(color).forEach((level) => {
      icons[level] = L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="${color[level]}"/>
          <circle cx="12" cy="11" r="5" fill="white" opacity="0.9"/>
        </svg>`,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
      });
    });

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: false,
      disableClusteringAtZoom: 10,
      iconCreateFunction: (cluster: any) => {
        const first = cluster.getAllChildMarkers()[0];
        const lat = first.getLatLng().lat;
        const point = this.floodData.find((p) => p.latitude === lat);
        const c = point ? color[point.risk_level] || '#64748b' : '#64748b';
        return L.divIcon({
          className: '',
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 24 32">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="${c}"/>
            <circle cx="12" cy="11" r="5" fill="white" opacity="0.9"/>
          </svg>`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });
      },
    });

    this.floodData.forEach((point) => {
      const icon = icons[point.risk_level] || icons['safe'];
      const marker = L.marker([point.latitude, point.longitude], { icon }).bindPopup(
        `
          <div style="padding:10px;font-family:inherit;min-width:180px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#f1f5f9;">
              Điểm đo #${point.id}
            </p>
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
              📍 ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}
            </p>
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
              🌧 Lượng mưa: ${point.precipitation_mm} mm
            </p>
            <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${color[point.risk_level]}22;color:${color[point.risk_level]};">
              ${this.getRiskLabel(point.risk_level)}
            </span>
          </div>
        `,
        { className: 'sos-popup-wrap', maxWidth: 240 },
      );
      clusterGroup.addLayer(marker);
    });

    this.map.addLayer(clusterGroup);
  }

  getRiskLabel(level: string): string {
    const map: Record<string, string> = {
      critical: 'Nguy hiểm nghiêm trọng',
      high: 'Nguy hiểm cao',
      moderate: 'Trung bình',
      safe: 'An toàn',
    };
    return map[level] || level;
  }

  getRiskClass(level: string): string {
    const map: Record<string, string> = {
      critical: 'risk-critical',
      high: 'risk-high',
      moderate: 'risk-moderate',
      safe: 'risk-safe',
    };
    return map[level] || '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('vi-VN');
  }
}
