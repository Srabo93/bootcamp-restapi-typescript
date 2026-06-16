# Observability Stack — OpenTelemetry + Grafana

## Architecture

```
App (Hono)
  ↓ OTLP HTTP (port 4318)
otel-collector
  ├──→ Prometheus (metrics — port 9090)
  └──→ Loki      (logs — port 3100)
         ↓
     Grafana (UI — port 3000)
         ↓
  Optional: Pyroscope (continuous profiling — port 4040)
```

## Services

| Service | Image | Ports | Purpose |
|---|---|---|---|
| `otel-collector` | `otel/opentelemetry-collector-contrib` | `4318` (OTLP HTTP), `8889` (Prometheus metrics) | Ingests OTel data from the app, exposes Prometheus endpoint |
| `prometheus` | `prom/prometheus` | `9090` | Metrics time-series DB — request rate, latency, error rate, MongoDB query times |
| `loki` | `grafana/loki` | `3100` | Log aggregation — structured Pino logs searchable by level, route, userId |
| `grafana` | `grafana/grafana` | `3000` | Unified dashboards — auto-provisioned with Prometheus + Loki datasources |
| `pyroscope` | `grafana/pyroscope` | `4040` | Continuous profiling — flame graphs of CPU/memory (optional) |

## Data Flow

1. App sends OTLP metrics + logs to `otel-collector:4318`
2. Collector exports metrics to Prometheus and logs to Loki
3. Grafana queries both backends for unified dashboards
4. (Optional) Pyroscope ingests app profiles via HTTP

## New Config Files

| File | Purpose |
|---|---|
| `config/otel/collector.yaml` | OTel receiver/processor/exporter pipelines |
| `config/prometheus/prometheus.yml` | Scrape otel-collector `:8889` and app `:9464` |
| `config/loki/loki-config.yaml` | Log storage configuration |
| `config/grafana/datasources.yml` | Auto-provision Prometheus + Loki datasources in Grafana |

## npm Packages

```
@opentelemetry/api
@opentelemetry/sdk-node
@opentelemetry/auto-instrumentations-node
@opentelemetry/exporter-metrics-otlp-http
@hono/otel
```

## App Changes

| File | Change |
|---|---|
| `tracing.ts` (new) | Initialize NodeSDK with metrics exporter + auto-instrumentations (disable `fs`, `dns`, `net`) |
| `server.ts` | `import "./tracing"` as **first line**, add `httpInstrumentationMiddleware` to Hono |
| `package.json` | Add 5 OTel packages |

## Docker Compose Additions

Add new services to `compose.yaml` alongside the existing `mongodb`, `minio`, and `server` services.

### otel-collector

```yaml
otel-collector:
  image: otel/opentelemetry-collector-contrib:latest
  command: ["--config=/etc/otel/collector.yaml"]
  volumes:
    - ./config/otel/collector.yaml:/etc/otel/collector.yaml
  ports:
    - "4318:4318"
    - "8889:8889"
  depends_on:
    - prometheus
    - loki
```

### prometheus

```yaml
prometheus:
  image: prom/prometheus:latest
  command:
    - "--config.file=/etc/prometheus/prometheus.yml"
    - "--storage.tsdb.path=/prometheus"
    - "--enable-feature=exemplar-storage"
  volumes:
    - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus-data:/prometheus
  ports:
    - "9090:9090"
```

### loki

```yaml
loki:
  image: grafana/loki:latest
  command: ["-config.file=/etc/loki/loki-config.yaml"]
  volumes:
    - ./config/loki/loki-config.yaml:/etc/loki/loki-config.yaml
    - loki-data:/loki
  ports:
    - "3100:3100"
```

### grafana

```yaml
grafana:
  image: grafana/grafana:latest
  environment:
    GF_SECURITY_ADMIN_USER: admin
    GF_SECURITY_ADMIN_PASSWORD: admin
  volumes:
    - ./config/grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
    - grafana-data:/var/lib/grafana
  ports:
    - "3000:3000"
  depends_on:
    - prometheus
    - loki
```

### pyroscope (optional)

```yaml
pyroscope:
  image: grafana/pyroscope:latest
  ports:
    - "4040:4040"
```

### Volumes

```yaml
volumes:
  prometheus-data:
  loki-data:
  grafana-data:
```

## Config Files

### `config/otel/collector.yaml`

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: "0.0.0.0:4318"

processors:
  batch:

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  loki:
    endpoint: "http://loki:3100/loki/api/v1/push"
  logging:
    loglevel: warn

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, logging]
    logs:
      receivers: [otlp]
      exporters: [loki]
```

### `config/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 10s

scrape_configs:
  - job_name: "otel-collector"
    static_configs:
      - targets: ["otel-collector:8889"]
  - job_name: "app"
    static_configs:
      - targets: ["server:9464"]
```

### `config/loki/loki-config.yaml`

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  instance_addr: 0.0.0.0
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: loki_index_
        period: 24h
```

### `config/grafana/datasources.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
```

## `tracing.ts`

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "bootcamp-api",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: "http://otel-collector:4318/v1/metrics",
    }),
    exportIntervalMillis: 30_000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
    }),
  ],
});

sdk.start();
```

## `server.ts` Changes

Import tracing **first**, before any other module:

```typescript
import "./tracing";

import { Hono } from "hono";
import { httpInstrumentationMiddleware } from "@hono/otel";
// ... rest of imports
```

Then register the OTel middleware on the Hono app:

```typescript
const app = new Hono();

app.use(
  "*",
  httpInstrumentationMiddleware({
    serviceName: "bootcamp-api",
    serviceVersion: "1.0.0",
  })
);
```

## What You'll See in Grafana

Once running:

1. Open `http://localhost:3000` (admin/admin)
2. **Explore → Prometheus**: query `http_server_duration_ms` for request latency per route
3. **Explore → Loki**: `{service_name="bootcamp-api"} |= "error"` to find error logs
4. **Dashboards**: Build panels showing request rate, MongoDB query duration, heap usage

## Implementation Order

1. Create config files: `config/otel/`, `config/prometheus/`, `config/loki/`, `config/grafana/`
2. Add OTel services to `compose.yaml`
3. Add volumes to `compose.yaml`
4. Install npm packages: `npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-metrics-otlp-http @hono/otel`
5. Create `tracing.ts`
6. Update `server.ts` — import tracing first, add `httpInstrumentationMiddleware`
7. `docker compose build server && docker compose up -d`
8. Verify `http://localhost:3000` has data
